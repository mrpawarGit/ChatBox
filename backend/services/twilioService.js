const twilio = require("twilio");
require("dotenv").config();

const accountSID = process.env.TWILIO_ACCOUNT_SID;
const serviceSID = process.env.TWILIO_SERVICE_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSID || !serviceSID || !authToken) {
  throw new Error("Missing Twilio environment variables");
}

const client = twilio(accountSID, authToken);

// Send OTP to phone number
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const response = await client.verify.v2
      .services(serviceSID)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    return {
      success: true,
      status: response.status, // pending
      to: response.to,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

// Verify OTP
const verifyOtp = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    const response = await client.verify.v2
      .services(serviceSID)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    return {
      success: response.status === "approved",
      status: response.status, // approved, pending
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw new Error("Failed OTP verification");
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };
