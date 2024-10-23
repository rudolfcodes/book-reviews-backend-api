const Quote = require("../models/Quote");

exports.addQuotes = async (req, res) => {
  try {
    const quotes = req.body.quotes;
    const savedQuotes = await Quote.insertMany(quotes);
    res.status(201).json(savedQuotes);
  } catch (error) {
    console.error("Error saving quotes: ", error);
    res.status(500).json({ message: "Failed to save quotes" });
  }
};

exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.status(200).json(quotes);
  } catch (error) {
    console.error("Error fetching the quotes: ", error);
    res.status(500).json({ error: "Something went wrong fetching the quotes" });
  }
};
