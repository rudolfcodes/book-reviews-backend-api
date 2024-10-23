const jwt = require("jsonwebtoken");

const generateToken = (user, expiration = "1h") => {
  return jwt.sign(
    { userId: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: expiration,
    }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
