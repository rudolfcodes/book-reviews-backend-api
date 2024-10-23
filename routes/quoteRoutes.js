const express = require("express");
const quoteController = require("../controllers/quoteController");
const router = express.Router();

router.get("/", quoteController.getQuotes);
router.post("/", quoteController.addQuotes);

module.exports = router;
