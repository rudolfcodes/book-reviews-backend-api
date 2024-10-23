const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  favoriteBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  reviews: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: [] },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
