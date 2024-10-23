const axios = require("axios");
const Book = require("../models/Book");
const User = require("../models/User");
const {
  fetchGoogleBooks,
  fetchGoogleBooksByAuthor,
} = require("../lib/fetchGoogleBooks");
const Review = require("../models/Review");
const { default: mongoose } = require("mongoose");

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const authorList = [
  "J.K. Rowling",
  "George Orwell",
  "Fyodor Dostoevsky",
  "Dante Alighieri",
  "Lev Tolstoy",
  "Aldous Huxley",
  "Mark Twain",
  "Jules Verne",
  "Oscar Wilde",
  "Edgar Allan Poe",
  "Charles Dickens",
  "John Grisham",
  "Dr. Seuss",
  "Lewis Carroll",
  "Mary Wollstonecraft Shelley",
  "Hans Christian Andersen",
  "Ralph Waldo Emerson",
  "Henry David Thoreau",
  "Arthur Conan Doyle",
  "Roald Dahl",
  "Aesop",
  "John Milton",
  "Agatha Christie",
  "William Faulkner",
  "F. Scott Fitzgerald",
  "Thomas Mann",
  "J. R. R. Tolkien",
  "Alexandre Dumas",
  "Kurt Vonnegut",
  "Robert Louis Stevenson",
  "Voltaire",
  "Langston Hughes",
  "Friedrich Nietzsche",
  "Hermann Hesse",
  "Stephen King",
  "Salman Rushdie",
  "Leonardo da Vinci",
  "Jules Verne",
  "David Mitchell",
  "Jennifer Egan",
  "Sheela Banerjee",
  "Dan Stone",
  "Yepoka Yeebo",
  "Chris Atkins",
  "Jeremy Clarkson",
  "Ben Aitken",
  "Ranulph Fiennes",
  "Jillian Lauren",
  "Helena Kelly",
  "Walter Isaacson",
  "Britney Spears",
  "Mick Rooney",
  "Anthony Bourdain",
  "Daniel Finkelstein",
  "Ros Atkins",
  "Billy Connolly",
  "Peter Thiel",
  "Ray Dalio",
  "Gregory Zuckerman",
  "Ron Chernow",
  "Tim Ferriss",
  "Barbara Corcoran",
  "Alice Schroeder",
  "Felix Dennis",
  "Rich Cohen",
  "Marc Randolph",
  "Ben Horowitz",
  "Patrick Radden Keefe",
  "Tony Hsieh",
  "Richard Branson",
  "Ray Kroc",
  "Simon Sinek",
  "Jessica Livingston",
  "Eric Schmidt",
  "Jack Welch",
  "Sam Walton",
  "Michael Lewis",
  "Duncan Clark",
  "Reeves Wiedeman",
  "Phil Knight",
];

exports.fetchByAuthor = async (req, res) => {
  const authorName = req.params.author;

  if (!authorName) {
    return res.status(400).json({ message: "Author name is required." });
  }

  console.log(`Searching books by author: ${authorName}`);

  try {
    // I want to find the author from the Google Books API
    const googleBooks = await fetchGoogleBooksByAuthor(authorName);

    if (!googleBooks || googleBooks.length === 0) {
      return res
        .status(404)
        .json({ message: "No books found for this author" });
    }

    // Map books to match DB schema
    const booksToInsert = googleBooks.map((item) => ({
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      publishedDate: item.volumeInfo.publishedDate,
      description: item.volumeInfo.description,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories,
      imageUrl: item.volumeInfo.imageLinks?.thumbnail,
      language: item.volumeInfo.language,
      googleId: item.id, // Unique Google Books ID
      averageRating: item.volumeInfo.averageRating,
    }));

    // Get all googleId values from the fetched books
    const googleIds = booksToInsert.map((book) => book.googleId);

    // Query DB for books with the same googleId
    const existingBooks = await Book.find({ googleId: { $in: googleIds } });

    // Get googleIds of existing books
    const existingGoogleIds = existingBooks.map((book) => book.googleId);

    // Filter out books that already exist in DB
    const newBooks = booksToInsert.filter(
      (book) => !existingGoogleIds.includes(book.googleId)
    );

    // Insert only the new non-duplicate books
    if (newBooks.length > 0) {
      await Book.insertMany(newBooks, { ordered: false });
      console.log(`Inserted ${newBooks.length} new books into the DB`);
    } else {
      console.log("No new books to insert.");
    }

    // Group all books by googleId and then remove duplicates (keeping only one book per googleId)
    const duplicates = await Book.aggregate([
      {
        $group: {
          //create a group of documents that have the same googleId
          _id: "googleId", // group by the googleId field
          count: { $sum: 1 }, // for every duplicate googleId, the count will be increased. so if count is bigger than 1, it means there are duplicates
          ids: { $push: "$_id" }, // create an array of ids for each document in the group. push adds the id of each document to an array for that group. This is useful because we want to know the unique id values for each duplicate document, so we can delete them later
        },
      },
      {
        $match: { count: { $gt: 1 } }, // filters the results from the previous group stage. it only keeps groups where count > 1(so it only keeps duplicates)
      },
    ]);

    // Remove duplicates (keep only one entry per googleId)
    const idsToRemove = duplicates.flatMap((dup) => dup.ids.slice(1)); // Keep one id, remove the rest
    if (idsToRemove > 0) {
      await Book.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`Removed ${idsToRemove.length} duplicate books from the DB.`);
    }

    // Return all books by this author(both new and already existing)
    const allBooks = await Book.find({
      authors: { $regex: new RegExp(authorName, "i") },
    });

    res.json(allBooks);
  } catch (error) {
    console.error("Error fetching or inserting books:", error);
    res.status(500).json({ message: error });
  }
};

exports.fetchAndStore = async (req, res) => {
  try {
    let allBooks = [];
    let uniqueAuthors = new Set();
    let attempts = 0;
    const maxAttempts = 50;

    while (allBooks.length < 200 && attempts < maxAttempts) {
      const randomAuthor =
        authorList[Math.floor(Math.random() * authorList.length)];

      if (!uniqueAuthors.has(randomAuthor)) {
        uniqueAuthors.add(randomAuthor);
        const booksByAuthor = await fetchGoogleBooks(
          `inauthor:${randomAuthor}`
        );
        allBooks = allBooks.concat(booksByAuthor);
        attempts++;
      }
    }

    const books = allBooks
      .filter((item) => item.volumeInfo.averageRating !== undefined)
      .map((item) => ({
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors,
        publishedDate: item.volumeInfo.publishedDate,
        description: item.volumeInfo.description,
        pageCount: item.volumeInfo.pageCount,
        categories: item.volumeInfo.categories,
        imageUrl: item.volumeInfo.imageLinks?.thumbnail,
        language: item.volumeInfo.language,
        googleId: item.id,
        averageRating: item.volumeInfo?.averageRating,
      }));

    const shuffledBooks = shuffleArray(books);

    // Use bulkWrite to upsert books into the database
    const bulkOps = shuffledBooks.map((book) => ({
      updateOne: {
        filter: { googleId: book.googleId }, // Ensure uniqueness by googleId
        update: { $set: book },
        upsert: true, // Insert the book if it doesn't exist
      },
    }));

    await Book.bulkWrite(bulkOps, { ordered: false });

    res.status(200).json({ message: "Books fetched and stored successfully" });
  } catch (error) {
    console.error("Error fetching and storing books: ", error.message);
    res.status(500).json({ error: "Failed to fetch and store books" });
  }
};

exports.countBooksByAuthor = async (authorNames) => {
  try {
    // Query the DB for all books that include any of the authorNames in the "authors" array
    const totalBooks = await Book.countDocuments({
      authors: { $in: authorNames.map((author) => new RegExp(author, "i")) },
    });

    // Return total number of books
    console.log(
      `Total books found for authors: ${authorNames.join(", ")}: ${totalBooks}`
    );
    return totalBooks;
  } catch (error) {
    console.error("Error counting books by authors: ", error);
    throw error;
  }
};

exports.getBookCountByAuthor = async (req, res) => {
  const { authors } = req.body;

  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return res.status(400).json({ message: "Authors array is required." });
  }

  try {
    const totalBooks = await this.countBooksByAuthor(authors);
    res.json({ totalBooks });
  } catch (error) {
    console.error("Error fetching book count: ", error);
    res.status(500).json({ message: "Error fetching book count." });
  }
};

exports.updateBooksWithRatings = async (req, res) => {
  try {
    // Fetch all books from db
    const books = await Book.find({});

    // iterate through each book
    for (const book of books) {
      // fetch updated books from google books API using googleId
      const updatedBooks = await fetchGoogleBooks(`id:${book.googleId}`);
      // if the updatedBookInfo has results(its an array)
      if (updatedBooks?.length > 0) {
        // get first result volumeInfo
        const googleBook = updatedBooks[0].volumeInfo;
        // update book in the db if it has an averageRating
        if (googleBook.averageRating !== "undefined") {
          await Book.updateOne(
            { _id: book._id },
            {
              $set: {
                title: googleBook.title || book.title,
                authors: googleBook.authors || book.authors,
                publishedDate: googleBook.publishedDate || book.publishedDate,
                description: googleBook.description || book.description,
                pageCount: googleBook.pageCount || book.pageCount,
                categories: googleBook.categories || book.categories,
                imageUrl: googleBook.imageLinks?.thumbnail || book.imageUrl,
                language: googleBook.language || book.language,
                averageRating: googleBook.averageRating,
              },
            }
          );
        }
      }
    }

    res
      .status(200)
      .json({ message: "Books updated with average ratings successfully" });
  } catch (err) {
    console.error("Error updating books with ratings: ", err);
    res.status(500).json({ error: "Failed to update books with ratings" });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books from the database: ", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
};

// Get book by single id
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ error: "Book was not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    return res.status(500).json({ error: "Failed to fetch book" });
  }
};

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

// Rate a book
exports.rateBook = async (req, res) => {
  try {
    // get bookId from params
    const { bookId } = req.params;
    // get userId and rating from body
    const { userId, rating } = req.body;
    // find book by id
    const book = await Book.findById(bookId);
    // if no book, return 404 with error msg
    if (!book) {
      return res.status(404).json({ error: "No book found" });
    }
    // find index of existing book
    const existingRatingIndex = book.ratings.findIndex(
      (r) => r.user.toString() === userId
    );
    // if the ratingIndex is not -1 / if there is an existing rating
    if (existingRatingIndex !== -1) {
      // set the rating of that book at that index to that rating
      book.ratings[existingRatingIndex].rating = rating;
    } else {
      // otherwise push that rating into the book ratings including the userId as the user because we need to make sure it is the id of that user
      book.ratings.push({ user: userId, rating });
    }

    // save book to db
    await book.save();
    // send json response with book
    res.json(book);
  } catch (error) {
    console.error("Error rating book", error);
    res.status(500).json({ error: "Failed to rate book" });
  }
};

exports.getReviewsById = async (req, res) => {
  const { bookId } = req.params;

  try {
    await Review.findById(bookId);
  } catch (error) {
    console.log(error);
  }
};

exports.getReviewByUserId = async (req, res) => {
  const { bookId, userId } = req.params;

  try {
    // Check if the userId is a valid ObjectId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const objectIdUser = new mongoose.Types.ObjectId(userId);
    console.log({ objectIdUser });
    const reviews = await Review.find({ userId: objectIdUser });

    const reviewByBookId = reviews.find(
      (review) => review.bookId.toString() === bookId.toString()
    );

    if (reviewByBookId) {
      return res.status(200).json({ review: reviewByBookId });
    } else {
      return res
        .status(404)
        .json({ message: "No review found for this book by this user" });
    }
  } catch (error) {
    console.error("Error finding review: ", error);
  }
};

exports.addReview = async (req, res) => {
  const { bookId } = req.params;
  // get rating, reviewText and userName from the body
  const { rating, reviewText, userName, userId } = req.body;

  try {
    // create a new review
    const newReview = new Review({
      userId,
      bookId,
      rating,
      reviewText,
      userName,
      reviewDate: new Date(),
    });

    // save review to db
    await newReview.save();

    // Update user reviews array
    await User.findByIdAndUpdate(userId, {
      $push: { reviews: newReview._id },
    });

    // send success status
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ message: "Error posting review." });
  }
};

exports.addComment = async (req, res) => {};
