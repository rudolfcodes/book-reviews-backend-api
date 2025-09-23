const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const validateOtp = (otp) => {
  const otpRegex = /^\d{4}$/;
  return otpRegex.test(otp);
};

module.exports = { generateOtp, validateOtp };
