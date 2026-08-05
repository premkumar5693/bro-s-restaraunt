const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const adminAuth = require('../middleware/adminAuth');

// Fetch all menu items natively grouped
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.findAll();
    
    // Group by category to match previous frontend structure
    const grouped = {};
    items.forEach(item => {
      if(!grouped[item.category]) {
        grouped[item.category] = { category: item.category, items: [] };
      }
      grouped[item.category].items.push(item);
    });
    
    const menuData = Object.values(grouped);
    res.json({ success: true, menuData });
  } catch(e) {
    console.error('Menu fetch error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a new menu item
router.post('/', adminAuth, async (req, res) => {
  try {
    const { id, name, price, type, category } = req.body;
    const item = await MenuItem.create({ id, name, price, type, category });
    res.status(201).json({ success: true, item });
  } catch(e) {
    console.error('Menu Post Error:', e);
    const msg = e.errors ? e.errors.map(err => err.message).join(', ') : 'Server error occurred.';
    res.status(400).json({ success: false, message: msg });
  }
});

// Update a menu item
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, price, type, category } = req.body;
    await MenuItem.update({ name, price, type, category }, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Item updated' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a menu item
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await MenuItem.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Item deleted' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
