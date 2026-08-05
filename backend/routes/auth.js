const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    let user = await User.findOne({ where: { phone } });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this phone number' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      phone,
      password: hashedPassword
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request Password Reset (Generates Mock OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ where: { phone } });
    if(!user) {
      // Sec: Always return success to prevent phone number enumeration
      return res.json({ success: true, message: 'If that number is registered, you will receive an OTP.' });
    }
    
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();
    
    // MOCK: For demo, returning the token directly. In real app, this sends an SMS and returns just a success message!
    res.json({ success: true, message: 'Reset token generated (MOCKED)', token: resetToken });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
});

// Apply New Password using OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, token, newPassword } = req.body;
    const { Op } = require('sequelize');
    const user = await User.findOne({ 
      where: { 
        phone, 
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }
      } 
    });
    
    if(!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    
    res.json({ success: true, message: 'Password has been reset successfully!' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
});

module.exports = router;
