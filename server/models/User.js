// server/models/User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  watchlist: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: { type: Boolean, default: false },
  otpCode: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  balance: { type: Number, default: 10000 },
  lastReset: { type: Date, default: Date.now },
  avatar: { type: String, default: null }, // base64 veya dosya yolu
  otpSendCount: { type: Number, default: 0 },
  otpLockUntil: { type: Date, default: null },
});

module.exports = mongoose.model("User", UserSchema);
