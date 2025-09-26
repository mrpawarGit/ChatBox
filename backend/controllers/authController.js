const UserModel = require("../models/user.model");
const otpGenerator = require("../utils/otpGenerator");
const response = require("../utils/response"); // custom response helper

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

      return response(res, 200, "OTP sent to your email", { email });
    }

    // Phone OTP flow
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone Number and phone Suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;

    user = await UserModel.findOne({ phoneNumber: fullPhoneNumber });
    if (!user) {
      user = new UserModel({ phoneNumber: fullPhoneNumber, phoneSuffix });
    }

    // generate/send the OTP
    user.phoneOtp = otp;
    user.phoneOtpExpire = expiry;
    await user.save();

    return response(res, 200, "OTP sent successfully", {
      phoneNumber: fullPhoneNumber,
    });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error");
  }
};

module.exports = sendOtp;
