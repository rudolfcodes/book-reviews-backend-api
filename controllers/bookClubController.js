const notificationService = require("../services/notificationService");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const clubService = require("../services/clubService");

exports.getAllBookClubs = async (req, res) => {
  try {
    const bookClubs = await clubService.getAllClubs(
      req.query,
      req.query.pagination
    );

    if (!bookClubs || bookClubs.length === 0) {
      return res.status(404).json({ message: "No book clubs found" });
    }
    sendSuccess(res, bookClubs, "Book clubs fetched successfully", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to fetch book clubs");
  }
};

exports.getBookClubById = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const bookClub = await clubService.getClubById(clubId);
    sendSuccess(res, bookClub, "Book club fetched successfully", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to fetch book club");
  }
};

exports.createBookClub = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user is authenticated
    const newClub = await clubService.createClub({
      ...req.body,
      creator: userId,
    });

    // Notify creator about successful club creation
    await notificationService.notifyClubCreated(
      userId,
      newClub._id,
      newClub.name
    );

    sendSuccess(res, newClub, "Book club created successfully", 201);
  } catch (error) {
    return sendError(res, error, 500, "Failed to create book club");
  }
};

exports.joinBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;

    const club = await clubService.joinClub(userId, clubId);

    await notificationService.notifyMemberJoined(
      club.creator,
      req.user.username,
      club.name,
      clubId
    );

    sendSuccess(res, club, "Successfully joined book club", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to join book club");
  }
};

exports.rsvpToMeeting = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user._id;
    const { rsvpStatus } = req.body; // e.g. "going", "not going", "maybe"
    const club = await clubService.getClubById(clubId);

    await clubService.rsvpToMeeting(userId, clubId, rsvpStatus);

    // create notification for club admin
    await notificationService.createNotification({
      recipient: club.creator,
      type: "event_rsvp",
      title: "RSVP Update",
      message: `${req.user.username} has updated their RSVP status to "${rsvpStatus}" for the meeting.`,
      relatedBookClub: clubId,
    });
    sendSuccess(res, club, "RSVP updated successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to RSVP to meeting");
  }
  // EMIT SOCKET EVENT FOR REAL-TIME UPDATE
};

exports.getClubMembers = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const members = await clubService.getClubMembers(clubId, req.user._id);

    sendSuccess(res, members, "Club members fetched successfully", 200);
  } catch (error) {
    return sendError(res, error.message, 403, "Failed to fetch club members");
  }
};

exports.updateBookClub = async (req, res) => {
  try {
    // User can only update book club if they are the creator/admin
    const clubId = req.params.clubId;
    const userId = req.user._id;
    const club = await clubService.updateClub(clubId, userId, req.body);

    // Notify all members about the update
    await notificationService.notifyClubUpdated(
      club.members,
      userId,
      req.user.username,
      club.name,
      clubId
    );

    await notificationService.createBulkNotifications(notifications);

    sendSuccess(res, null, "Book club updated successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to update book club");
  }
};

exports.leaveBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;

    const club = await clubService.leaveClub(userId, clubId);

    // Notify admin about member leaving
    await notificationService.createNotification({
      recipient: club.creator,
      type: "system_announcement",
      title: "Member Left",
      message: `${req.user.username} has left the book club "${club.name}".`,
      relatedBookClub: clubId,
    });

    sendSuccess(res, null, "Left book club successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to leave book club");
  }
};

exports.deleteBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;
    const club = await clubService.deleteClub(clubId, userId);

    // notify all members about club deletion
    await notificationService.notifyClubDeleted(
      club.members,
      userId,
      club.name
    );

    await notificationService.createBulkNotifications(notifications);

    sendSuccess(res, null, "Book club deleted successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to delete book club");
  }
};
