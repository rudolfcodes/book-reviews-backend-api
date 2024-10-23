const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [String],
  publishedDate: String,
  isbn: String,
  description: String,
  pageCount: Number,
  categories: [String],
  imageUrl: String,
  language: String,
  googleId: { type: String, required: true, unique: true },
  ratings: [ratingSchema],
  averageRating: Number,
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
