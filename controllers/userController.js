const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const nodemailer = require("nodemailer");
const { generateOtp } = require("../utils/Otp");

const transporter = nodemailer.createTransport({
  host: "mail.digitalnomadrudolf.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Configuration Error:", error);
  } else {
    console.log("SMTP Configuration Success:", success);
  }
});

exports.resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user was found..." });
    }
    user.password = bcrypt.hashSync(password, 10);
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
          .json({ message: "Failed to send confirmation email" });
      }
      res.json({ message: "Password changed successfully" });
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

// User login endpoint
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

    res.json({ message: "OTP has been sent to your email", userId: user._id });
  } catch (error) {
    console.log("Error logging in user:", error);
    res.status(500).json({ error: "Failed to login user" });
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
