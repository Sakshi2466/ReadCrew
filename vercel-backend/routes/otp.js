const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map();

// Email transporter
let transporter = null;

console.log('🔧 Initializing OTP routes...');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter verification failed:', error.message);
      } else {
        console.log('✅ Email transporter is ready');
      }
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
  }
} else {
  console.warn('⚠️ Email credentials not configured - OTP will be returned in response');
}

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    console.log('📨 OTP request received:', { name, email, phone });

    if (!email) {
      console.log('❌ Email missing');
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

    let emailSent = false;
    
    // Try to send email
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"ReadCrew" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'ReadCrew - Your Verification Code',
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
        console.error('Full error:', emailError);
      }
    } else {
      console.log('⚠️ No email transporter available');
    }

    // ALWAYS return success with OTP (for development)
    const response = {
      success: true,
      message: emailSent 
        ? 'OTP sent to your email! Check your inbox.' 
        : '⚠️ Email service unavailable. Your OTP is shown below.',
      emailSent: emailSent
    };

    // Include OTP in response if email failed OR if in development
    if (!emailSent || process.env.NODE_ENV === 'development') {
      response.otp = otp;
    }

    console.log('📤 Sending response:', response);
    res.json(response);
    
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
      console.log('❌ Missing email or OTP');
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      console.log(`❌ No OTP found for ${email}`);
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
        message: 'Invalid OTP. Please try again.'
      });
    }

    // OTP is valid
    otpStore.delete(email);
    console.log(`✅ OTP verified successfully for ${email}`);

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