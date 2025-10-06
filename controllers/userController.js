const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const { generateOtp } = require("../utils/Otp");
const transporter = require("../utils/emailTransporter");

exports.resetPassword = async (req, res) => {
  const { password, token } = req.body;

  try {
    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(404).json({ message: "No user was found..." });
    }
    user.password = bcrypt.hashSync(password, 10);
    user.resetToken = undefined;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Changed Successfully",
      text: "Your password has been changed successfully",
      html: "<p>Your password has been changed successfully</p>",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending mail:", error);
        return res
          .status(500)
          .json({
            message: "Failed to send confirmation email",
            success: false,
          });
      }
      res.json({
        success: true,
        message:
          "Password changed successfully. A confirmation email has been sent.",
      });
    });
  } catch (error) {
    console.error("An error occurred changing the password: ", error);
    res.status(500).json({ message: "A server error occurred" });
  }
};

exports.registerUser = async (req, res) => {
  const { username, password, confirmPassword, email } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords must match" });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({
      username,
      email,
      password: bcrypt.hashSync(password, 10),
    });

    await user.save();

    const token = generateToken(user);

    res.json({ token, user });
  } catch (error) {
    console.error("Registration error: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        error:
          "No user exists with this email address. Please create an account first",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    // if there is no match, return 400 status and an error msg using json method Invalid username or password
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: "Invalid password. Please provide a correct password" });
    }

    const otp = generateOtp();
    // store otp in database with userId, code, expiresAt (10 mins from now), attempts (0), reused (false)
    otpEntry = new OTP({
      userId: user._id,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      reused: false,
    });

    await otpEntry.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 10 minutes.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending mail:", error);
      }
    });

    res.json({
      message: "OTP has been sent to your email",
      userId: user._id,
      otpRequired: true,
    });
  } catch (error) {
    console.log("Error logging in user:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
};

exports.verifyForgotPasswordToken = async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({ resetToken: token });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  res.json({ valid: !!user });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No user found with the provided email" });
    }

    const resetToken = generateToken(user, "1h");

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${resetLink}`,
      html: `<p>Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    };

    // save the reset token to the user's record (you might want to create a separate field for this)
    user.resetToken = resetToken;
    await user.save();

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending mail:", error);
        return res.status(500).json({ error: "Failed to send reset email" });
      }
      res
        .status(200)
        .json({ message: "Password reset email sent successfully" });
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Failed to process forgot password" });
  }
};

// Only for usage for admin/system purposes
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("No user found:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

exports.getCurrentUserProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res.status(500).json({ error: "Failed to fetch current user profile" });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user by username:", error);
    res.status(500).json({ error: "Failed to fetch user by username" });
  }
};
