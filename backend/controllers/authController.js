const UserModel = require("../models/user.model");
const sendOtpToEmail = require("../services/emailService");
const otpGenerator = require("../utils/otpGenerator");
const response = require("../utils/responseHandler"); // custom response helper
const twilioService = require("../services/twilioService");
const generateToken = require("../utils/generateToken");

const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerator();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  try {
    let user;

    // Email OTP flow
    if (email) {
      user = await UserModel.findOne({ email });
      if (!user) {
        user = new UserModel({ email });
      }

      user.emailOtp = otp;
      user.emailOtpExpire = expiry;
      await user.save();

      // send email with generated OTP
      await sendOtpToEmail(email, otp);

      return response(res, 200, "OTP sent to your email", { email });
    }

    // Phone OTP flow (Twilio Verify will send a code)
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;

    user = await UserModel.findOne({ phoneNumber: fullPhoneNumber });
    if (!user) {
      user = new UserModel({ phoneNumber: fullPhoneNumber, phoneSuffix });
      await user.save();
    }

    // trigger Twilio Verify (Twilio will send the code)
    await twilioService.sendOtpToPhoneNumber(fullPhoneNumber);

    return response(res, 200, "OTP sent successfully", {
      phoneNumber: fullPhoneNumber,
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// verify otp
const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;

  try {
    let user;

    // Email verification: compare with stored OTP
    if (email) {
      user = await UserModel.findOne({ email });
      if (!user) {
        return response(res, 404, "User not found");
      }

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpire)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpire = null;
      await user.save();
    } else {
      // Phone verification via Twilio Verify
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and phone suffix are required");
      }

      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await UserModel.findOne({ phoneNumber: fullPhoneNumber });
      if (!user) {
        return response(res, 404, "User not found");
      }

      const result = await twilioService.verifyOtp(fullPhoneNumber, otp);

      // Twilio returns status === 'approved' when code is correct
      if (!result || result.status !== "approved") {
        return response(res, 400, "Invalid OTP");
      }

      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    // Set cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return response(res, 200, "OTP verified successfully", { token, user });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

module.exports = { sendOtp, verifyOtp };
