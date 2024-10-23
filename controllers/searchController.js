const Book = require("../models/Book");

exports.searchBooks = async (req, res) => {
  const { page, limit, query } = req.query;
  const skip = (page - 1) * limit;

  // if no query, return a 400 with json message that "Query parameter is required"
  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    // Search for books matching the title, or any of the authors or anything in the description text of the books
    // Use Book model to find and use an $or array with each object being an instruction of what to look for. So a title and authors object that has the query as the string to be matched using Regex
    const searchCondition = query
      ? {
          $or: [
            { title: new RegExp(query, "i") },
            { authors: { $regex: new RegExp(query, "i") } },
            { description: new RegExp(query, "i") },
          ],
        }
      : {};

    const books = await Book.find(searchCondition).skip(skip).limit(limit);
    const totalCount = await Book.countDocuments(searchCondition);

    // Return 404 message if no books found
    if (books.length === 0) {
      return res
        .status(404)
        .json({ message: `No books have been found for your query: ${query}` });
    }
    // Return the books in the res json
    res.json({ books, totalCount });
    // Catch console log the error with a message and a 500 status error with message
  } catch (error) {
    console.error("Something went wrong getting the search results: ", error);
    res.status(500).json({ message: "Server error" });
  }
};
