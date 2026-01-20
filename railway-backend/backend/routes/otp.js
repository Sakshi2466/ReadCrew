// backend/routes/otp.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate Random Password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Send OTP with Password
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    
    console.log('🔐 OTP Request for:', { email, phone, name });
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Generate OTP and Password
    const otp = generateOTP();
    const tempPassword = generatePassword(); // Generate password
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log('📱 Generated OTP:', otp);
    console.log('🔑 Generated Password:', tempPassword);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with hashed password
      user = new User({
        email,
        phone,
        name,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false
      });
    } else {
      // Update existing user with new OTP
      user.otp = otp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    // Send Email with OTP AND Password
    const mailOptions = {
      from: `"ReadCrew" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your ReadCrew Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed;">📚 ReadCrew</h1>
            <p style="color: #666; font-size: 18px;">#Let's make reading a habit</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 15px;">Your Account Details</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 10px;">Hello ${name},</p>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Thank you for registering with ReadCrew. Here are your account details:
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
              <h3 style="color: #7c3aed; margin-bottom: 15px;">🔐 Account Credentials</h3>
              
              <div style="margin-bottom: 15px;">
                <p style="font-size: 14px; color: #666; margin: 0 0 5px 0;">Your OTP Code:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #7c3aed; margin: 10px 0;">${otp}</div>
                <p style="font-size: 12px; color: #ef4444; margin: 5px 0;">
                  ⏰ Valid for 10 minutes
                </p>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #666; margin: 0 0 5px 0;">Your Temporary Password:</p>
                <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border: 1px dashed #d97706;">
                  <code style="font-size: 18px; font-family: 'Courier New', monospace; color: #92400e; font-weight: bold;">
                    ${tempPassword}
                  </code>
                </div>
                <p style="font-size: 12px; color: #92400e; margin: 8px 0 0 0;">
                  🔒 Save this password for future logins
                </p>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              <strong>Instructions:</strong>
            </p>
            <ol style="color: #666; font-size: 14px; margin: 10px 0 20px 20px; padding: 0;">
              <li>Enter the OTP on the IndiaRead website to verify your account</li>
              <li>Save your password for future logins</li>
              <li>You can change your password after logging in</li>
            </ol>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #d97706;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⚠️ Security Notice:</strong> Never share your OTP or password with anyone. 
              IndiaRead team will never ask for your credentials.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              If you didn't request this account, please ignore this email.<br>
              Need help? Contact us at ${process.env.EMAIL_USER}
            </p>
            <p style="color: #7c3aed; font-size: 14px; margin-top: 10px;">
              Happy Reading! 📖
            </p>
          </div>
        </div>
      `
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email with password sent to ${email}`);
      
      res.json({ 
        success: true, 
        message: `OTP and password sent to ${email}`,
        otp: otp, // For development/testing
        passwordSent: true
      });
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Return OTP and password in response for development
      res.json({ 
        success: true, 
        message: 'Development mode: Email not sent',
        otp: otp,
        password: tempPassword,
        note: 'Check console for credentials'
      });
    }

  } catch (error) {
    console.error('🔥 OTP Send Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process OTP request',
      error: error.message 
    });
  }
});

// Verify OTP (unchanged)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 Verifying OTP for:', email);

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    // Find user with valid OTP
    const user = await User.findOne({ 
      email,
      otp,
      otpExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log('❌ Invalid/Expired OTP for:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    // OTP verified successfully
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    user.lastLogin = new Date();
    
    await user.save();

    console.log(`✅ OTP verified for: ${email}`);

    // Create response user object (without password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Account verified successfully!',
      user: userResponse,
      note: 'Password was sent to your email'
    });

  } catch (error) {
    console.error('🔥 OTP Verify Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP',
      error: error.message 
    });
  }
});

module.exports = router;