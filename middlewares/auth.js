const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  // try catch
  try {
    // decoded is result of verifying token
    const decoded = verifyToken(token);
    // get user by id
    const user = await User.findById(decoded.id);
    // if there is no user, throw an Error
    if (!user) {
      throw new Error();
    }
    // set request user to be the user
    req.user = user;
    // call next
    next();
    // the catch returns a res status 401 with msg Please authenticate
  } catch (error) {
    res.status(401).json({ error: "Please authenticate" });
  }
};

module.exports = auth;
