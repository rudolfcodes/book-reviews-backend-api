const BookClub = require("../models/BookClub");
const { validateObjectId } = require("../utils/validation");
const User = require("../models/User");

class ClubService {
  async getClubs(filters = {}, pagination) {
    const { page = 1, limit = 10, sortBy = "newest" } = pagination || {};
    const { canton, city, language, genre } = filters;
    const filter = {};

    if (canton) filter["location.canton"] = canton;
    if (city) filter["location.city"] = city;
    if (language) filter.language = language;
    if (genre) filter.genre = genre;

    let sortCriteria;
    switch (sortBy) {
      case "popular":
        sortCriteria = { members: -1 };
        break;
      case "name":
        sortCriteria = { name: 1 };
        break;
      case "newest":
        sortCriteria = { createdAt: -1 };
        break;
      case "oldest":
        sortCriteria = { createdAt: 1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalDocs = await BookClub.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limitNum);
    const docs = await BookClub.find(filter)
      .populate("creator", "username avatar")
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    return {
      docs,
      totalDocs,
      limit: limitNum,
      totalPages: totalPages,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    };
  }

  async createClub(clubData, userId) {
    const newClub = new BookClub({
      ...clubData,
      creator: userId,
      members: [{ userId, role: "admin" }], // Add creator as admin
    });

    await newClub.save();
    await User.findByIdAndUpdate(userId, {
      $push: { clubsJoined: newClub._id, clubsCreated: newClub._id },
    });

    return newClub;
  }

  async updateClub(clubId, userId, data) {
    const isAdmin = await this.isUserAdmin(userId, clubId);

    if (!isAdmin) {
      throw new Error("Only admins can update club details");
    }

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        [
          "name",
          "description",
          "location",
          "genre",
          "language",
          "isPrivate",
          "meetingFrequency",
        ].includes(key)
      )
    );

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }

    await BookClub.updateOne({ _id: clubId }, { $set: updateData });
    // await this.updateClubMembers(
    //   updateData.members.map((member) => member.userId.toString()),
    //   clubId
    // );

    return await this.getClubById(clubId);
  }

  async deleteClub(clubId, userId) {
    const club = await this.getClubById(clubId);
    const isAdmin = await this.isUserAdmin(userId, clubId);
    if (!isAdmin) {
      throw new Error("Only admins can delete this club");
    }

    await BookClub.findByIdAndDelete(clubId);

    const memberIds = club.members.map((member) => member.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { clubsJoined: clubId } }
    );

    await User.updateOne({ _id: userId }, { $pull: { clubsCreated: clubId } });

    await BookClub.findByIdAndDelete(clubId);

    return club;
  }

  async getClubById(clubId) {
    validateObjectId(clubId, "Club ID");
    const club = await BookClub.findById(clubId);
    if (!club) {
      throw new Error("Book club not found");
    }
    return club;
  }

  async leaveBookClub(userId, clubId) {
    validateObjectId(clubId, "Club ID");
    const club = await this.getClubById(clubId);

    if (
      !club.members.some(
        (member) => member.userId.toString() === userId.toString()
      )
    ) {
      throw new Error("User is not a member of this club");
    }

    club.members = club.members.filter(
      (member) => member.userId.toString() !== userId
    );

    await club.save();
    return club;
  }

  async isUserAdmin(userId, clubId) {
    const club = await this.getClubById(clubId);
    return club.members.some(
      (member) =>
        member.userId.toString() === userId.toString() &&
        member.role === "admin"
    );
  }
}

module.exports = new ClubService();
// This service can be used in controllers to manage book club memberships and roles.
