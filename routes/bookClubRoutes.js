const express = require("express");
const router = express.Router();
const bookClubController = require("../controllers/bookClubController");
const auth = require("../middlewares/auth");

// PUBLIC ROUTES:
router.get("/", bookClubController.getAllBookClubs); // Browse clubs
router.get("/:id", bookClubController.getBookClubById); // Club details

// AUTHENTICATED ROUTES:
router.post("/", auth, bookClubController.createBookClub);
router.post("/:id/join", auth, bookClubController.joinBookClub);
router.post("/:id/leave", auth, bookClubController.leaveBookClub);
router.put("/:id/rsvp", auth, bookClubController.rsvpToMeeting);
router.get("/:id/members", auth, bookClubController.getClubMembers);

// ADMIN ONLY ROUTES:
router.put("/:id", auth, bookClubController.updateBookClub); // Need to add admin check
router.delete("/:id", auth, bookClubController.deleteBookClub); // Need to add admin check

module.exports = router;
