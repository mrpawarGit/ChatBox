const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // allows multiple users without phoneNumber
      trim: true,
    },
    phoneSuffix: { type: String, unique: false },
    username: { type: String },
    email: {
      type: String,
      lowercase: true,
      sparse: true, // so multiple users can exist without email
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Invalid email address format",
      },
    },
    emailOtp: { type: String },
    emailOtpExpire: { type: Date },
    profilePicture: { type: String },
    about: { type: String },
    lastSeen: { type: Date },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    agreed: { type: Boolean, default: false }, // terms & conditions agreement
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
