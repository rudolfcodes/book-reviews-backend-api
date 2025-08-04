const { fetchGoogleBooks } = require("../lib/fetchGoogleBooks");

/* **Autocomplete Book Titles for Event Creation**
When a club organizer creates a new reading event, they need to specify which book the club will be reading. Instead of manually typing all book details, this function provides autocomplete suggestions.
1. User goes to "Create Event" form
2. User starts typing in book field: "Harry Pot..."
3. This function searches Google Books API and returns simplified results:
 */
exports.getBookSuggestions = async (req, res) => {
  try {
    const query = req.query.q || "";
    const books = await fetchGoogleBooks(query);
    const simplifiedBooks = books.map((book) => ({
      id: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors || [],
      thumbnail: book.volumeInfo.imageLinks?.thumbnail || "",
    }));
    res.json(simplifiedBooks);
  } catch (error) {
    console.error("Error fetching book from Google Books API:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch book from Google Books API" });
  }
};
