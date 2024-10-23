const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const nodemailer = require("nodemailer");

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
    // find user by email
    const user = await User.findOne({ email });
    // if no user, return 404 with message
    if (!user) {
      return res.status(404).json({ message: "No user was found..." });
    }
    // use bcrypt hashSync to encrypt password
    user.password = bcrypt.hashSync(password, 10);
    // save user to db
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
    // console error message
    console.error("An error occurred changing the password: ", error);
    // send 500 status with json and message stating that there has been a server error
    res.status(500).json({ message: "A server error occurred" });
  }
};

// User registration endpoint
exports.registerUser = async (req, res) => {
  // try catch block
  // get username, password & email from request body
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
    // fetch email and password from request body
    const { email, password, rememberMe } = req.body;
    // find user by email using User model and findOne
    const user = await User.findOne({ email });
    // if no user, return status 400 and error: Invalid username or password
    if (!user) {
      return res.status(400).json({
        error:
          "No user exists with this email address. Please create an account first",
      });
    }
    // use bcrypt to check if there is a password match using the compare method
    const isMatch = await bcrypt.compare(password, user.password);
    // if there is no match, return 400 status and an error msg using json method Invalid username or password
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: "Invalid password. Please provide a correct password" });
    }
    // Set token expiration based on rememberMe
    const expiresIn = rememberMe ? "7d" : "1d";
    // generate token from user
    const token = generateToken(user, expiresIn);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });
    // send the response with the user & token
    res.json({ user, token });
  } catch (error) {
    console.log("Error logging in user:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
};

exports.addReviews = async (req, res) => {
  try {
    await User.updateMany(
      { reviews: { $exists: false } },
      { $set: { reviews: [] } }
    );
  } catch (error) {
    console.log("could not add reviews property");
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "favoriteBooks wishlist reviews"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("No user found:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// Add book to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    // get userId from req params
    const { userId } = req.params;
    // get bookId from body
    const { bookId } = req.body;
    // get user by id
    const user = await User.findById(userId);
    // if wishlist does not include book with this bookId
    if (!user.wishlist.includes(bookId)) {
      // push it into the user wishlist
      user.wishlist.push(bookId);
      // save user to db
      await user.save();
    }
    // send user response
    res.json(user);
  } catch (error) {
    console.log("Error adding book to wishlist:", error);
    res.status(500).json({ error: "Could not add book to wishlist" });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { bookId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.wishlist = user.wishlist.filter((id) => id.toString() !== bookId);
    await user.save();

    res.status(200).json({ message: "Book removed from wishlist" });
  } catch (error) {
    console.log("Error removing book from wishlist:", error);
    res.status(500).json({ error: "Could not remove book from wishlist" });
  }
};

// Get user wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("wishlist");
    if (!user) {
      return res.status(404).json({ error: "No user found" });
    }
    res.json(user.wishlist);
  } catch (error) {
    console.error("Error getting the wishlist:", error);
    res.status(500).json({ error: "Could not get wishlist" });
  }
};
