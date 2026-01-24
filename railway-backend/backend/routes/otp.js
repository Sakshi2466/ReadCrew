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
// CHANGED FROM '/send-otp' TO '/send'
router.post('/send', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    console.log('📧 Send OTP Request:', { email, phone, name });
    
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = generateOTP();
    const tempPassword = generatePassword();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ 
        email, 
        phone: phone || '', 
        name: name || '', 
        password: hashedPassword, 
        otp, 
        otpExpires, 
        isVerified: false 
      });
      console.log('✅ New user created:', email);
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      if (phone) user.phone = phone;
      if (name) user.name = name;
      console.log('✅ Existing user updated:', email);
    }
    
    await user.save();
    console.log('✅ OTP saved to DB:', otp);

    // Send Email
    const mailOptions = {
      from: `"ReadCrew" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your ReadCrew OTP & Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #f97316; text-align: center;">📚 Welcome to ReadCrew!</h2>
          <p>Hello <strong>${name || 'User'}</strong>,</p>
          <p>Your OTP for verification is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 5px; padding: 15px; background: #fef3c7; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="text-align: center; color: #888; font-size: 12px;">
            Let's make reading a habit! 📖
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Still return success if email fails (for development)
      return res.json({ 
        success: true, 
        message: 'OTP generated but email failed. Check console for OTP.',
        otp: otp  // Send OTP in response for development
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP & password sent to email',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only send OTP in dev
    });
  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP', 
      error: error.message,
      details: 'Check server logs'
    });
  }
});

// ====== Verify OTP ======
// CHANGED FROM '/verify-otp' TO '/verify'
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('🔐 Verify OTP Request:', { email, otp });
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'User not found. Please request OTP again.' 
      });
    }

    console.log('📋 User found:', user.email);
    console.log('📋 Stored OTP:', user.otp);
    console.log('📋 OTP Expires:', user.otpExpires);
    console.log('📋 Current time:', new Date());

    // Check if OTP matches and is not expired
    if (!user.otp || user.otp !== otp) {
      console.log('❌ OTP mismatch or missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    if (user.otpExpires < new Date()) {
      console.log('❌ OTP expired');
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // OTP is valid - update user
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    user.lastLogin = new Date();
    
    await user.save();
    console.log('✅ User verified successfully:', email);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      readingGoal: { monthly: 0, books: [] }
    };

    res.json({ 
      success: true, 
      message: 'Account verified successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Verify OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP', 
      error: error.message 
    });
  }
});

module.exports = router;
