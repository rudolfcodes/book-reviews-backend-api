const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

router.get("/", eventController.getEvents);
router.get("/:eventId", eventController.getEventById);

module.exports = router;
