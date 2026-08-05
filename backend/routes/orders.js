const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch(e) {}
  }
  next();
};

const requireAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Access denied' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

// Create a new order (from Frontend Checkout)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const newOrder = await Order.create({
      customerDetails: req.body.customerDetails || {},
      items: req.body.items || [],
      totalAmount: req.body.totalAmount || 0,
      status: 'Pending',
      userId: req.user ? req.user.id : null
    });
    
    // Broadcast real-time event to Admin dashboard
    req.app.get('io').emit('new_order', newOrder);
    
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Fetch secure order history for a logged in user
router.get('/user/history', requireAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch(e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch ALL raw historical orders (for Admin Analytics)
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json(orders);
  } catch(e) {
    res.status(500).json({ success: false, message: 'Server error on analytics query' });
  }
});

// Fetch a single order by ID for tracking
// Note: Placed below `/all` so exact matches evaluate first.
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json(order);
  } catch(e) {
    res.status(500).json({ success: false, message: 'Invalid order ID' });
  }
});

// Fetch all active orders (for Admin Dashboard initial load)
router.get('/', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const orders = await Order.findAll({ 
        where: { status: { [Op.ne]: 'Delivered' } },
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch(e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
