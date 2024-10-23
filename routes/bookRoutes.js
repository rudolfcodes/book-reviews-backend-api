const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");

router.get("/", bookController.getBooks);
router.get("/:bookId", bookController.getBook);
router.get(
  "/:bookId/reviews/getReviewByUser/:userId",
  bookController.getReviewByUserId
);
//router.get("/:bookId/reviews", bookController.getReviewsById);
router.get("/google/:googleId", bookController.getBookByGoogleId);
router.get("/author/:author", bookController.fetchByAuthor);
router.post("/fetch-and-store", bookController.fetchAndStore);
router.put("/update-and-store", bookController.updateBooksWithRatings);
router.post("/:bookId/rate", bookController.rateBook);
router.post("/count", bookController.getBookCountByAuthor);
router.post("/:bookId/reviews", bookController.addReview);
router.post("/:bookId/comments/:commentId", bookController.addComment);
//router.post("/:userId/favorite", bookController.addFavoriteBook);

module.exports = router;
