// PSEUDO CODE - controllers/bookClubController.js

const BookClub = require("../models/BookClub");
const User = require("../models/User");
const Notification = require("../models/Notification");

const getClubById = async (clubId) => {
  if (!mongoose.Types.ObjectId.isValid(clubId)) {
    throw new Error("Invalid club ID");
  }
  const club = await BookClub.findById(clubId);
  return club;
};

const isUserAdmin = async (userId, clubId) => {
  const club = await getClubById(clubId);
  return club.members.some(
    (member) => member.userId.toString() === userId && member.role === "admin"
  );
};

// GET ALL BOOK CLUBS (SWISS LOCATION FILTERING):
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
    await Notification.create({
      recipient: userId,
      type: "system_announcement",
      title: "Book Club Created",
      message: `You have successfully created the book club "${name}".`,
      relatedBookClub: newClub._id,
    });
    res.status(201).json(newClub);
  } catch (error) {
    console.error("Error creating book club:", error);
    return res.status(500).json({ message: "Failed to create book club" });
  }
};

exports.joinBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;

    const club = await getClubById(clubId);

    if (!club) {
      return res.status(404).json({ message: "Book club not found" });
    }

    if (club.members.some((member) => member.userId.toString() === userId)) {
      return res.status(400).json({ message: "Already a member of this club" });
    }

    // check if club is private
    if (club.isPrivate) {
      return res.status(403).json({ message: "This club is private" });
    }
    // check if club is active
    if (club.status !== "active") {
      return res.status(403).json({ message: "This club is not active" });
    }

    // check member limit
    if (club.maxMembers && club.members.length >= club.maxMembers) {
      return res.status(403).json({ message: "Member limit reached" });
    }

    club.members.push({ userId, role: "member" });
    await club.save();
    // UPDATE USER'S MEMBERSHIPS
    await User.findByIdAndUpdate(userId, {
      $push: { clubsJoined: clubId },
    });
    // CREATE NOTIFICATION FOR CLUB ADMIN
    await Notification.create({
      recipient: club.creator,
      type: "system_announcement",
      title: "New Member Joined",
      message: `${req.user.username} has joined your book club "${club.name}".`,
      relatedBookClub: clubId,
    });

    // return response
    res.status(200).json({
      message: "Successfully joined book club",
      club,
    });
  } catch (error) {
    console.error("Error joining book club:", error);
    return res.status(500).json({ message: "Failed to join book club" });
  }
};

exports.rsvpToMeeting = async (req, res) => {
  const clubId = req.params.clubId;
  const userId = req.user._id;
  const { rsvpStatus } = req.body; // e.g. "going", "not going", "maybe"
  try {
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Book club not found" });
    }

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
    await Notification.create({
      recipient: club.creator,
      type: "event_rsvp",
      title: "RSVP Update",
      message: `${req.user.username} has updated their RSVP status to "${rsvpStatus}" for the meeting.`,
      relatedBookClub: clubId,
    });
    res.status(200).json({
      message: "RSVP updated successfully",
      club,
    });
  } catch (error) {
    console.error("Error RSVPing to meeting:", error);
    return res.status(500).json({ message: "Failed to RSVP to meeting" });
  }
  // EMIT SOCKET EVENT FOR REAL-TIME UPDATE
};

exports.getClubMembers = async (req, res) => {
  try {
    const clubId = req.params.clubId;

    const club = await BookClub.findById(clubId).populate({
      path: "members.userId",
      select: "username avatar",
    });

    if (!club) {
      return res.status(404).json({ message: "Book club not found" });
    }

    const isMember = club.members.some((member) =>
      member.userId._id.equals(req.user._id)
    );

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

    res.status(200).json({ members });
  } catch (error) {
    console.error("Error fetching club members:", error);
    return res.status(500).json({ message: "Failed to fetch club members" });
  }
};

exports.updateBookClub = async (req, res) => {
  try {
    // User can only update book club if they are the creator/admin
    const clubId = req.params.clubId;
    const userId = req.user._id;
    const club = await getClubById(clubId);

    if (!club) {
      return res.status(404).json({ message: "Book club not found" });
    }

    const isAdmin = await isUserAdmin(userId, clubId);

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
    const notifications = club.members
      .filter((member) => !member.userId.equals(userId))
      .map((member) => ({
        recipient: member.userId,
        type: "system_announcement",
        title: "Book Club Updated",
        message: `${req.user.username} has updated the book club "${club.name}".`,
        relatedBookClub: clubId,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    const updatedClub = await BookClub.findById(clubId);
    res.status(200).json({
      message: "Book club updated successfully",
      club: updatedClub,
    });
  } catch (error) {
    console.error("Error updating book club:", error);
    return res.status(500).json({ message: "Failed to update book club" });
  }
};

exports.deleteBookClub = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user._id;

    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Book club not found" });
    }

    const isAdmin = await isUserAdmin(userId, clubId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can delete this club" });
    }

    // notify all members about club deletion
    const notifications = club.members
      .filter((member) => !member.userId.equals(userId))
      .map((member) => ({
        recipient: member.userId,
        type: "system_announcement",
        title: "Book Club Deleted",
        message: `${req.user.username} has deleted the book club "${club.name}".`,
        relatedBookClub: clubId,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

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

    res.status(200).json({
      message: "Book club deleted successfully",
      clubId,
    });
  } catch (error) {
    console.error("Error deleting book club:", error);
    return res.status(500).json({ message: "Failed to delete book club" });
  }
};
