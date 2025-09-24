const BookClub = require("../models/BookClub");
const { validateObjectId } = require("../utils/validation");
const clubService = require("./clubService");

class ClubRsvpService {
  async rsvpToMeeting(userId, clubId, rsvpStatus) {
    // validate rsvpStatus
    const validStatuses = ["attending", "maybe", "not_attending", "pending"];
    if (!validStatuses.includes(rsvpStatus)) {
      return res.status(400).json({ message: "Invalid RSVP status" });
    }

    await this.updateRsvpStatus(userId, clubId, rsvpStatus);
    return await clubService.getClubById(clubId);
  }

  async updateRsvpStatus(userId, clubId, rsvpStatus) {
    validateObjectId(clubId, "Club ID");
    const club = await clubService.getClubById(clubId);

    await BookClub.updateOne(
      { _id: clubId, "members.userId": userId },
      { $set: { "members.$.rsvpStatus": rsvpStatus } }
    );

    await club.save();
    return club;
  }
}

module.exports = new ClubRsvpService();
// This is a class that will handle RSVP logic for clubs.
