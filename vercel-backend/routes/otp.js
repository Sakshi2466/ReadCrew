const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Store OTPs in memory
const otpStore = new Map();

// Email transporter with better configuration
let transporter = null;

console.log('🔧 Initializing OTP routes...');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com', // Explicit host
      port: 587, // Explicit port (TLS)
      secure: false, // Use TLS (not SSL)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000
    });
    
    console.log('✅ Email transporter created');
    
    // Verify connection (but don't block if it fails)
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email verification failed:', error.message);
        console.log('⚠️ Will continue with OTP fallback');
      } else {
        console.log('✅ Email transporter verified and ready');
      }
    });
  } catch (error) {
    console.error('❌ Failed to create transporter:', error.message);
  }
} else {
  console.warn('⚠️ Email credentials not configured');
}

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    console.log('📨 OTP request received:', { name, email, phone });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated OTP for ${email}: ${otp}`);
    
    // Store OTP
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      userData: { name, email, phone }
    });

    let emailSent = false;
    
    // Try to send email (but don't wait forever)
    if (transporter) {
      try {
        console.log('📧 Attempting to send email...');
        
        const mailOptions = {
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
              </div>
            </div>
          `
        };

        // Send with timeout
        await Promise.race([
          transporter.sendMail(mailOptions),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout')), 8000)
          )
        ]);
        
        emailSent = true;
        console.log(`✅ Email sent successfully to ${email}`);
        
      } catch (emailError) {
        console.error('❌ Email send failed:', emailError.message);
        emailSent = false;
      }
    }

    // ALWAYS return success with OTP
    const response = {
      success: true,
      message: emailSent 
        ? 'OTP sent to your email! Check your inbox.' 
        : '⚠️ Email service temporarily unavailable. Your OTP is shown below.',
      emailSent: emailSent,
      otp: otp // ALWAYS include OTP for now
    };

    console.log('📤 Sending response:', { ...response, otp: '***' + otp.slice(-3) });
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

    console.log(`🔍 Verifying OTP for ${email}`);

    if (!email || !otp) {
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
      console.log(`❌ Invalid OTP for ${email}`);
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