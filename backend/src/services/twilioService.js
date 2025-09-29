const twilio = require('twilio');
require('dotenv').config();

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

// Send OTP to phone number (phone number must include country code, e.g., +911234567890)
const sendOtp = async (phoneNumber) => {
  try {
    console.log('Sending OTP to:', phoneNumber);  // Logging the phone number for debugging
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const response = await client.verify.v2.services(serviceSid).verifications.create({
      to: phoneNumber, // Full phone number including country code
      channel: 'sms',
    });

    return response;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};


const verifyOtp = async (fullPhoneNumber, otp) => {
    try {
      console.log(`Verifying OTP for: ${fullPhoneNumber}`);
      console.log('Service SID:', serviceSid);
  
      const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
        to: fullPhoneNumber, 
        code: otp,      
      });
      console.log('Verification response:', response);
      return response;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('OTP verification failed');
    }
  };
  

module.exports = {
  sendOtp,
  verifyOtp,
};
