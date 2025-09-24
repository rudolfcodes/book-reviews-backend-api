const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Club relationships
  clubsJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
  clubsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],

  // Event relationships
  eventsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  eventsAttending: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

  // Profile details
  avatar: { type: String, default: "default-avatar.png" },
  bio: { type: String, maxlength: 500 },
  location: {
    city: { type: String },
    country: { type: String },
  },
  language: { type: String, enum: ["en", "de", "fr"], default: "en" },
  isVerified: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
