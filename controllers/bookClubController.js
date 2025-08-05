const BookClub = require("../models/BookClub");
const User = require("../models/User");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const clubService = require("../services/clubService");

exports.getAllBookClubs = async (req, res) => {
  try {
    // list all book clubs with optional filters
    const { canton, city, language, category } = req.query;
    const filter = {};
    if (canton) filter["location.canton"] = canton;
    if (city) filter["location.city"] = city;
    if (language) filter.language = language;
    if (category) filter.category = category;

    // paginate and sort as needed
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }, // newest first
      populate: {
        path: "members.userId",
        select: "username avatar",
      },
    };
    const paginatedClubs = await BookClub.paginate(filter, options);
    res.json(paginatedClubs);
  } catch (error) {
    console.error("Error fetching book clubs:", error);
    return res.status(500).json({ message: "Failed to fetch book clubs" });
  }
};

exports.createBookClub = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      category,
      language,
      isPrivate,
      meetingFrequency,
    } = req.body;

    // Validate required fields
    if (!name || !description || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if club with same name already exists
    const existingClub = await BookClub.findOne({
      name: new RegExp(`^${name}$`, "i"), // Case-insensitive match
      "location.city": location.city,
    });
    if (existingClub) {
      return res.status(400).json({
        message: "A club with this name already exists in this city.",
      });
    }

    const userId = req.user._id; // Assuming user is authenticated
    const newClub = new BookClub({
      name,
      description,
      location,
      category,
      language,
      isPrivate,
      meetingFrequency,
      creator: userId,
    });
    newClub.members.push({ userId, role: "admin" }); // Add creator as admin
    await newClub.save();
    // update user's clubs membership
    await User.findByIdAndUpdate(userId, {
      $push: { clubsJoined: newClub._id, clubsCreated: newClub._id },
    });

    // Notify creator about successful club creation
    await notificationService.notifyClubCreated(userId, newClub._id, name);

    sendSuccess(res, newClub, "Book club created successfully", 201);
  } catch (error) {
    return sendError(res, error, 500, "Failed to create book club");
  }
};

exports.joinBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;

    const club = await clubService.getClubById(clubId);

    if (club.members.some((member) => member.userId.toString() === userId)) {
      return res.status(400).json({ message: "Already a member of this club" });
    }

    // check if already member
    if (await clubService.checkMembership(userId, clubId)) {
      return sendError(res, null, 400, "Already a member of this club");
    }

    // check if club is private
    if (club.isPrivate) {
      return sendError(res, null, 403, "This club is private");
    }
    // check if club is active
    if (club.status !== "active") {
      return sendError(res, null, 403, "This club is not active");
    }

    // check member limit
    if (club.maxMembers && club.members.length >= club.maxMembers) {
      return sendError(res, null, 403, "Member limit reached");
    }

    // add user to club
    await clubService.addMemberToClub(userId, clubId);

    // UPDATE USER'S MEMBERSHIPS
    await User.findByIdAndUpdate(userId, {
      $push: { clubsJoined: clubId },
    });

    // CREATE NOTIFICATION FOR CLUB ADMIN
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
  const clubId = req.params.clubId;
  const userId = req.user._id;
  const { rsvpStatus } = req.body; // e.g. "going", "not going", "maybe"
  try {
    const club = await clubService.getClubById(clubId);

    // validate rsvpStatus
    const validStatuses = ["attending", "maybe", "not_attending", "pending"];
    if (!validStatuses.includes(rsvpStatus)) {
      return res.status(400).json({ message: "Invalid RSVP status" });
    }

    // update user's RSVP status
    await BookClub.updateOne(
      { _id: clubId, "members.userId": userId },
      { $set: { "members.$.rsvpStatus": rsvpStatus } }
    );
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

    const club = await clubService.getClubById(clubId).populate({
      path: "members.userId",
      select: "username avatar",
    });

    const isMember = clubService.checkMembership(req.user._id, clubId);

    const members = club.members.map((member) => ({
      userId: member.userId,
      role: member.role,
      username: member.userId.username,
      avatar: member.userId.avatar,
      rsvpStatus: member.rsvpStatus || "pending",
      joinedAt: member.joinedAt,
    }));

    if (!isMember && club.isPrivate) {
      return res
        .status(403)
        .json({ message: "You must be a member to view members" });
    }

    sendSuccess(res, members, "Club members fetched successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to fetch club members");
  }
};

exports.updateBookClub = async (req, res) => {
  try {
    // User can only update book club if they are the creator/admin
    const clubId = req.params.clubId;
    const userId = req.user._id;
    const club = await clubService.getClubById(clubId);

    const isAdmin = await clubService.isUserAdmin(userId, clubId);

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can update club details" });
    }

    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        [
          "name",
          "description",
          "location",
          "category",
          "language",
          "isPrivate",
          "meetingFrequency",
        ].includes(key)
      )
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await BookClub.updateOne({ _id: clubId }, { $set: updateData });

    // Notify all members about the update
    const notifications = await notificationService.notifyClubUpdated(
      club.members,
      userId,
      req.user.username,
      club.name,
      clubId
    );

    await notificationService.createBulkNotifications(notifications);

    await clubService.updateClubMembers(
      club.members.map((member) => member.userId.toString()),
      clubId
    );

    sendSuccess(res, null, "Book club updated successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to update book club");
  }
};

exports.deleteBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;

    const club = await clubService.getClubById(clubId);

    const isAdmin = await clubService.isUserAdmin(userId, clubId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can delete this club" });
    }

    // notify all members about club deletion
    const notifications = await notificationService.notifyClubDeleted(
      club.members,
      userId,
      club.name
    );

    await notificationService.createBulkNotifications(notifications);

    // update user's clubsCreated and clubsJoined
    const memberIds = club.members.map((member) => member.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      {
        $pull: { clubsJoined: clubId },
      }
    );

    await User.updateOne({ _id: userId }, { $pull: { clubsCreated: clubId } });

    // delete bookclub
    await BookClub.findByIdAndDelete(clubId);

    sendSuccess(res, null, "Book club deleted successfully", 200);
  } catch (error) {
    return sendError(res, error, 500, "Failed to delete book club");
  }
};
