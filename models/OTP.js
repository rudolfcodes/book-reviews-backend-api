const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  reused: { type: Boolean, default: false },
});

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
