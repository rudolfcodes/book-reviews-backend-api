const OTP = require("../models/OTP");

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const verifyOtpCode = async (userId, otp) => {
  try {
    const otpRegex = /^\d{4}$/;

    if (!otpRegex.test(otp)) {
      return { success: false, message: "Invalid OTP" };
    }
    const otpEntry = await OTP.findOne({ userId });
    if (!otpEntry) {
      return { success: false, message: "Invalid OTP" };
    }
    if (otpEntry.attempts >= 3) {
      return { success: false, message: "Maximum OTP attempts exceeded" };
    }
    if (otpEntry.expiresAt < new Date()) {
      return { success: false, message: "OTP has expired" };
    }

    if (otpEntry.code !== otp) {
      otpEntry.attempts += 1;
      await otpEntry.save();
      return { success: false, message: "Invalid OTP" };
    }

    // Delete OTP entry after successful verification
    await OTP.deleteOne({ userId });
    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "Server error" };
  }
};

const generateAndStoreOtp = async (userId) => {
  await OTP.deleteMany({ userId });
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const code = generateOtp();
  const otpEntry = new OTP({
    userId,
    code,
    expiresAt,
    attempts: 0,
    reused: false,
  });
  await otpEntry.save();
  return code;
};

module.exports = { generateOtp, verifyOtpCode, generateAndStoreOtp };
