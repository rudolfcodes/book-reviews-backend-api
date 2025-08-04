const axios = require("axios");
const { fetchGoogleBooks } = require("../lib/fetchGoogleBooks");

// Function to autocomplete book titles for event creation
exports.getBookByGoogleId = async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${req.params.googleId}`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching book from Google Books API:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch book from Google Books API" });
  }
};
