const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String },
  backgroundImage: { type: String },
});

const Quote = mongoose.model("Quote", quoteSchema);

module.exports = Quote;
