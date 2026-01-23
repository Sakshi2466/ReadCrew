// routes/otp.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ====== Nodemailer Setup ======
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

// ====== Helpers ======
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

// ====== Send OTP ======
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = generateOTP();
    const tempPassword = generatePassword();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, phone, name, password: hashedPassword, otp, otpExpires, isVerified: false });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      if (phone) user.phone = phone;
      if (name) user.name = name;
    }
    await user.save();

    // Send Email
    const mailOptions = {
      from: `"ReadCrew" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your ReadCrew OTP & Password',
      html: `<h2>Hello ${name || 'User'},</h2>
             <p>OTP: <strong>${otp}</strong> (Valid 10 mins)</p>
             <p>Temporary Password: <strong>${tempPassword}</strong></p>
             <p>Do not share OTP or password with anyone.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'OTP & password sent to email' });
  } catch (error) {
    console.error('❌ Send OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

// ====== Verify OTP ======
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const user = await User.findOne({ email, otp, otpExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    res.json({ success: true, message: 'Account verified successfully' });
  } catch (error) {
    console.error('❌ Verify OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
});

module.exports = router;
