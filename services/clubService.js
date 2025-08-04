const BookClub = require("../models/BookClub");
const { validateObjectId } = require("../utils/validationUtils");

class ClubService {
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

  async addMemberToClub(userId, clubId) {
    const club = await this.getClubById(clubId);
    if (!club) {
      throw new Error("Book club not found");
    }
    if (club.members.some((member) => member.userId.toString() === userId)) {
      throw new Error("User is already a member of this club");
    }
    club.members.push({ userId, role: "member" });
    await club.save();
    return club;
  }

  async checkMembership(userId, clubId) {
    const club = await this.getClubById(clubId);
    return club.members.some((member) => member.userId.toString() === userId);
  }

  async removeMemberFromClub(userId, clubId) {
    const club = await this.getClubById(clubId);
    if (!club) {
      throw new Error("Book club not found");
    }
    club.members = club.members.filter(
      (member) => member.userId.toString() !== userId
    );
    await club.save();
    return club;
  }

  async updateClubMembers(memberIds, clubId) {
    const club = await this.getClubById(clubId);
    if (!club) {
      throw new Error("Book club not found");
    }
    club.members = club.members.filter((member) =>
      memberIds.includes(member.userId.toString())
    );
    await club.save();
    return club;
  }
}

module.exports = new ClubService();
// This service can be used in controllers to manage book club memberships and roles.
