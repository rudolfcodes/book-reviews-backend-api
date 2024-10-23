const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
    required: true,
  },
  commentText: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  commentDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
