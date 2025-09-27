const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Gmail connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Gmail service connection failed:", error);
  } else {
    console.log("Gmail configuration successful. Ready to send emails.");
  }
});

const sendOtpToEmail = async (email, otp) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #075e54;">🔐 ChatBox Verification</h2>
        
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

    const mailOptions = {
      from: `ChatBox Web <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your ChatBox Verification Code",
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Email sending failed");
  }
};

module.exports = sendOtpToEmail;
