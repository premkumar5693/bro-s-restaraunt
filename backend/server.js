const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

require('dotenv').config(); // load from project root
const sequelize = require('./db');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const menuRoutes = require('./routes/menu');
const reservationRoutes = require('./routes/reservations');
const Order = require('./models/Order');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket io to express app
app.set('io', io);

app.use(cors());
app.use(express.json());

// SQLite Connection
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Local Database synced successfully');

    // Auto-cleanup: Keep order history for 3 months
    const { Op } = require('sequelize');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    Order.destroy({
      where: {
        createdAt: { [Op.lt]: threeMonthsAgo }
      }
    }).then(deleted => {
      if (deleted > 0) console.log(`🧹 Cleaned up ${deleted} old orders.`);
    }).catch(console.error);

  })
  .catch(err => console.error('❌ DB Sync Error:', err));

// API Routes
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);

// Real-time Socket.IO Connection
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // When the Admin updates an order's status
  socket.on('update_status', async (data) => {
    const { id, status } = data;
    try {
      await Order.update({ status }, { where: { id } });
      const order = await Order.findByPk(id);
      if (order) {
        console.log(`Order ${id} status updated to: ${status}`);
        // Broadcast to everyone (including the customer tracking the order)
        io.emit('status_update', order);
      }
    } catch (err) {
      console.log('socket update error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log('Listening for real-time WebSocket connections...');
});
