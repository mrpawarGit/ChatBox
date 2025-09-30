// emailOptService.js
const sgMail = require("@sendgrid/mail");
const dotenv = require("dotenv");

dotenv.config();

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send OTP email using SendGrid
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 */
const sendOtpToEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #4a90e2;">🔐 ChatBox Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your ChatBox account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>ChatBox Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

  try {
    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL, // must be verified in SendGrid
      subject: "Your ChatBox Verification Code",
      html,
    });
    console.log(`OTP email sent successfully to ${email}`);
  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err.message);
    throw err;
  }
};

module.exports = sendOtpToEmail;
