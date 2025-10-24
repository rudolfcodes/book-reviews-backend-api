const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const eventController = require("../controllers/eventController");

router.get("/", eventController.getEvents);
router.post("/", auth, eventController.createEvent);

module.exports = router;
