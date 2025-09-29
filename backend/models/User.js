const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, unique: true, sparse: true }, 
    phoneSuffix: { type: String ,unique:false},
    username: { type: String },
    email : {
        type:String,
       lowercase: true,
       match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
   emailOtp: { type: Number },
   emailOtpExpiry: { type: Date },
    profilePicture: { type: String },
    about: { type: String },
    lastSeen: { type: Date },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    agreed: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User ;