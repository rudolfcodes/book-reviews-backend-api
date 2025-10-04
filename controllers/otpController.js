const OTP = require("../models/OTP");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { setAuthCookie } = require("../utils/setAuthCookie");

const verifyOtp = async (req, res) => {
  try {
    const { userId, otp, rememberMe } = req.body;
    const otpResult = await OTP.verifyOtpCode(userId, otp);

    if (!otpResult.success) {
      return res.status(400).json({ error: otpResult.message });
    }

    // Upon successful OTP verification, generate a token
    const expiresIn = rememberMe ? "7d" : "1h";
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const token = generateToken(user, expiresIn);
    setAuthCookie(res, token, rememberMe);
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await OTP.sendOtpCode(user);
    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
};

module.exports = { verifyOtp, resendOtp };
