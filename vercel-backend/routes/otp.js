const express = require("express");
const router = express.Router();
const brevo = require('@getbrevo/brevo');

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map();

// Initialize Brevo API with new SDK
let brevoConfigured = false;
let apiInstance = null;

console.log('🔧 Initializing OTP routes with Brevo...');
console.log('📧 BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET ✓' : 'NOT SET ✗');

if (process.env.BREVO_API_KEY) {
  try {
    const defaultClient = brevo.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    apiInstance = new brevo.TransactionalEmailsApi();
    brevoConfigured = true;
    console.log('✅ Brevo email service configured successfully');
  } catch (error) {
    console.error('❌ Failed to configure Brevo:', error.message);
  }
} else {
  console.warn('⚠️ BREVO_API_KEY not found - OTP will be returned in response only');
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    console.log("📨 OTP request received for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log("🔐 Generated OTP:", otp, "for:", email);
    
    // Store OTP with 10-minute expiry
    otpStore.set(email, { 
      otp, 
      expiresAt: Date.now() + 10 * 60 * 1000,
      userData: { name, email, phone }
    });
    
    let emailSent = false;
    
    // Try to send email via Brevo
    if (brevoConfigured && apiInstance) {
      try {
        console.log('📧 Attempting to send email via Brevo...');
        
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        
        sendSmtpEmail.subject = "ReadCrew - Your Verification Code";
        sendSmtpEmail.sender = { 
          name: "ReadCrew", 
          email: process.env.BREVO_SENDER_EMAIL || "noreply@readcrew.com"
        };
        sendSmtpEmail.to = [{ email: email, name: name || "User" }];
        sendSmtpEmail.htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">📚 ReadCrew</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Let's make reading a habit</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome${name ? ', ' + name : ''}! 👋</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                          Thank you for joining ReadCrew! To verify your email address, please use the verification code below:
                        </p>
                        
                        <!-- OTP Box -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="background-color: #f3f4f6; padding: 30px; border-radius: 10px;">
                              <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #f97316; font-family: 'Courier New', monospace;">
                                ${otp}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                          ⏰ This code will expire in <strong>10 minutes</strong>.<br>
                          🔒 For your security, never share this code with anyone.<br>
                          ❓ If you didn't request this code, please ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                          Happy Reading! 📖
                        </p>
                        <p style="color: #6b7280; font-size: 14px; font-weight: bold; margin: 0;">
                          The ReadCrew Team
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        // Send email
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        emailSent = true;
        console.log('✅ Email sent successfully via Brevo. Message ID:', data.messageId);
        
      } catch (emailError) {
        console.error('❌ Failed to send email via Brevo:', emailError.message);
        if (emailError.response) {
          console.error('   Response:', emailError.response.text);
        }
      }
    }
    
    // Respond with success
    const response = {
      success: true,
      message: emailSent 
        ? "OTP sent to your email! Check your inbox." 
        : "⚠️ Email service temporarily unavailable. Your OTP is shown below.",
      emailSent: emailSent,
      otp: otp, // Always include OTP for development/fallback
      expiresIn: "10 minutes"
    };
    
    console.log('📤 Response:', { ...response, otp: '***' + otp.slice(-3) });
    res.json(response);
    
  } catch (error) {
    console.error("❌ Error in send-otp:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
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
        message: "Email and OTP are required"
      });
    }

    const stored = otpStore.get(email);
    
    if (!stored) {
      console.log('❌ No OTP found for:', email);
      return res.json({
        success: false,
        message: "OTP not found or expired. Please request a new one."
      });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      console.log('❌ OTP expired for:', email);
      return res.json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    if (stored.otp !== otp) {
      console.log('❌ Invalid OTP for:', email, '(Expected:', stored.otp, 'Got:', otp + ')');
      return res.json({
        success: false,
        message: "Invalid OTP. Please try again."
      });
    }

    // OTP is valid
    otpStore.delete(email);
    console.log("✅ OTP verified successfully for:", email);
    
    res.json({
      success: true,
      message: "OTP verified successfully",
      user: stored.userData
    });
    
  } catch (error) {
    console.error("❌ Error in verify-otp:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
});

module.exports = router;