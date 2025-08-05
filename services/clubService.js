const BookClub = require("../models/BookClub");
const { validateObjectId } = require("../utils/validationUtils");
const User = require("../models/User");

class ClubService {
  async getAllClubs(filters, pagination) {
    const { canton, city, language, category } = filters;
    const filter = {};

    if (canton) filter["location.canton"] = canton;
    if (city) filter["location.city"] = city;
    if (language) filter.language = language;
    if (category) filter.category = category;

    const options = {
      page: parseInt(pagination.page || 1),
      limit: parseInt(pagination.limit || 10),
      sort: { createdAt: -1 }, // newest first
      populate: {
        path: "members.userId",
        select: "username avatar",
      },
    };

    return await BookClub.paginate(filter, options);
  }

  async doesClubExist(clubName, city) {
    const regex = new RegExp(`^${clubName}$`, "i"); // Case-insensitive match
    return await BookClub.exists({ name: regex, "location.city": city });
  }

  async createClub(clubData, userId) {
    const existingClub = await this.doesClubExist(
      clubData.name,
      clubData.location.city
    );
    if (existingClub) {
      throw new Error("A club with this name already exists in this city.");
    }

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

  async updateClub(clubId, updateData) {
    const isAdmin = await this.isUserAdmin(updateData.userId, clubId);

    if (!isAdmin) {
      throw new Error("Only admins can update club details");
    }

    const updateData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) =>
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
      throw new Error("No valid fields to update");
    }

    await BookClub.updateOne({ _id: clubId }, { $set: updateData });
    await this.updateClubMembers(
      updateData.members.map((member) => member.userId.toString()),
      clubId
    );

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

  async isUserAdmin(userId, clubId) {
    const club = await this.getClubById(clubId);
    return club.members.some(
      (member) => member.userId.toString() === userId && member.role === "admin"
    );
  }
}

module.exports = new ClubService();
// This service can be used in controllers to manage book club memberships and roles.
