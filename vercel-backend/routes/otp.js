const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Email transporter (with fallback)
let transporter = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email transporter initialized');
  } else {
    console.warn('⚠️ Email credentials not found - OTP will only show in logs');
  }
} catch (error) {
  console.error('❌ Email transporter error:', error);
}

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`🔐 Generated OTP for ${email}: ${otp}`);
    
    // Store OTP with 10-minute expiry
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      userData: { name, email, phone }
    });

    // Try to send email
    let emailSent = false;
    
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'ReadCrew - Verify Your Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="color: white; margin: 0;">📚 ReadCrew</h1>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}!</h2>
                <p style="color: #4b5563; font-size: 16px;">Your verification code is:</p>
                
                <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316;">${otp}</span>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                <p>Happy Reading! 📖</p>
                <p><strong>The ReadCrew Team</strong></p>
              </div>
            </div>
          `
        });
        
        emailSent = true;
        console.log(`✅ Email sent successfully to ${email}`);
        
      } catch (emailError) {
        console.error('❌ Email send failed:', emailError.message);
      }
    }

    // Always return success with OTP (for development/testing)
    res.json({
      success: true,
      message: emailSent 
        ? 'OTP sent to your email!' 
        : 'Email service unavailable. Check console for OTP.',
      otp: process.env.NODE_ENV === 'development' || !emailSent ? otp : undefined,
      emailSent: emailSent
    });
    
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log(`🔍 Verifying OTP for ${email}: ${otp}`);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      console.log(`❌ OTP not found for ${email}`);
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.'
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      console.log(`❌ OTP expired for ${email}`);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (storedData.otp !== otp) {
      console.log(`❌ Invalid OTP for ${email}. Expected: ${storedData.otp}, Got: ${otp}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP is valid!
    otpStore.delete(email);
    console.log(`✅ OTP verified for ${email}`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: storedData.userData
    });
    
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;