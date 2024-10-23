const axios = require("axios");

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

const fetchGoogleBooks = async (query) => {
  try {
    const response = await axios.get(GOOGLE_BOOKS_API, {
      params: {
        q: query,
        maxResults: 20,
      },
    });

    return response.data.items;
  } catch (error) {
    console.error(
      "Error fetching books from Google Books API:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const fetchGoogleBooksByAuthor = async (authorName) => {
  let startIndex = 0;
  const maxResults = 40;

  try {
    const response = await axios.get(GOOGLE_BOOKS_API, {
      params: {
        q: `inauthor:${authorName}`,
        startIndex,
        maxResults,
      },
    });

    if (response.data && response.data.items) {
      return response.data.items;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching books from Google Books API:", error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
};

module.exports = { fetchGoogleBooks, fetchGoogleBooksByAuthor };
