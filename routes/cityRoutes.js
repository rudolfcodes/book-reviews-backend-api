const express = require("express");
const router = express.Router();
const cityController = require("../controllers/cityController");
const auth = require("../middlewares/auth");

router.get("/search", auth, cityController.getCitySuggestions);

module.exports = router;
