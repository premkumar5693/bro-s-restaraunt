const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const adminAuth = require('../middleware/adminAuth');

// Create a new table reservation
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, date, time, guests } = req.body;

    // In a real app, validate that date isn't in the past

    const reservation = await Reservation.create({
      name, phone, email, date, time, guests
    });

    // Optional: emit real-time event to Admin dashboard eventually
    if (req.app.get('io')) {
      req.app.get('io').emit('new_reservation', reservation);
    }

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    console.error('Reservation Error:', error);
    res.status(500).json({ success: false, message: 'Server error while booking table' });
  }
});

// Fetch all reservations (for Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reservations);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update reservation status (Admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await Reservation.update({ status }, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Reservation status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
