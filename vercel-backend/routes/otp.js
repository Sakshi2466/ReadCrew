const express = require("express");
const router = express.Router();

// Store OTPs in memory
const otpStore = new Map();

console.log('🔧 Initializing OTP routes with Brevo REST API...');
console.log('📧 BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET ✓' : 'NOT SET ✗');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email via Brevo REST API
async function sendBrevoEmail(to, name, otp) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: "ReadCrew",
          email: "gunwantigaikwad@gmail.com"  // YOUR VERIFIED EMAIL
        },
        to: [{
          email: to,
          name: name || "User"
        }],
        subject: "ReadCrew - Your Verification Code",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0;">📚 ReadCrew</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Let's make reading a habit</p>
              </div>
              <div style="padding: 40px;">
                <h2 style="color: #1f2937;">Welcome${name ? ', ' + name : ''}! 👋</h2>
                <p style="color: #4b5563; font-size: 16px;">Your verification code is:</p>
                <div style="background: #f3f4f6; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
                  <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #f97316;">${otp}</div>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  ⏰ Expires in 10 minutes<br>
                  🔒 Never share this code
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Brevo API error:', error.message);
    return { success: false, error: error.message };
  }
}

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    console.log("📨 OTP request for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const otp = generateOTP();
    console.log("🔐 Generated OTP:", otp);
    
    otpStore.set(email, { 
      otp, 
      expiresAt: Date.now() + 10 * 60 * 1000,
      userData: { name, email, phone }
    });
    
    let emailSent = false;
    
    if (process.env.BREVO_API_KEY) {
      console.log('📧 Sending via Brevo...');
      const result = await sendBrevoEmail(email, name, otp);
      
      if (result.success) {
        emailSent = true;
        console.log('✅ Email sent! ID:', result.messageId);
      } else {
        console.error('❌ Send failed:', result.error);
      }
    }
    
    res.json({
      success: true,
      message: emailSent ? "OTP sent to your email!" : "⚠️ Email unavailable. OTP shown below.",
      emailSent: emailSent,
      otp: otp,
      expiresIn: "10 minutes"
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP
router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("🔍 Verifying OTP for:", email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required"
      });
    }

    const stored = otpStore.get(email);
    
    if (!stored) {
      return res.json({
        success: false,
        message: "OTP not found. Request a new one."
      });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.json({
        success: false,
        message: "OTP expired. Request a new one."
      });
    }

    if (stored.otp !== otp) {
      return res.json({
        success: false,
        message: "Invalid OTP."
      });
    }

    otpStore.delete(email);
    console.log("✅ OTP verified!");
    
    res.json({
      success: true,
      message: "Verified!",
      user: stored.userData
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;