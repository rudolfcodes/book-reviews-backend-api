const express = require("express");
const router = express.Router();
const bookClubController = require("../controllers/bookClubController");
const auth = require("../middlewares/auth");

// PUBLIC ROUTES:
router.get("/", bookClubController.getBookClubs);
router.get("/:clubId/events", bookClubController.getClubEvents);

// AUTHENTICATED ROUTES:
router.post("/", auth, bookClubController.createBookClub);
router.post("/:clubId/join", auth, bookClubController.joinBookClub);
router.post("/:clubId/leave", auth, bookClubController.leaveBookClub);
router.post("/:clubId/events", auth, eventController.createEvent);
router.put("/:clubId/rsvp", auth, bookClubController.rsvpToMeeting);
router.get("/:clubId/members", auth, bookClubController.getClubMembers);

// ADMIN ONLY ROUTES:
router.put("/:clubId", auth, bookClubController.updateBookClub);
router.delete("/:clubId", auth, bookClubController.deleteBookClub);
router.get("/:clubId", bookClubController.getBookClubById);

module.exports = router;
