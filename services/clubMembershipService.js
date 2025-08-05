const User = require("../models/User");
const clubService = require("./clubService");

class ClubMembershipService {
  async joinClub(userId, clubId) {
    const club = await clubService.getClubById(clubId);

    await this.validateClubJoin(club, userId);

    club.members.push({ userId, role: "member" });
    await club.save();

    await User.findByIdAndUpdate(userId, {
      $push: { clubsJoined: clubId },
    });

    return club;
  }

  async removeMemberFromClub(userId, clubId) {
    const club = await clubService.getClubById(clubId);
    club.members = club.members.filter(
      (member) => member.userId.toString() !== userId
    );
    await club.save();
    return club;
  }

  async getClubMembers(clubId, userId) {
    const club = await clubService.getClubById(clubId);
    if (!club.members.some((member) => member.userId.toString() === userId)) {
      throw new Error("User is not a member of this club");
    }
    return club.members;
  }

  async validateClubJoin(club, userId) {
    if (club.members.some((member) => member.userId.toString() === userId)) {
      throw new Error("Already a member of this club");
    }

    if (club.isPrivate) {
      throw new Error("This club is private");
    }

    if (club.status !== "active") {
      throw new Error("This club is not active");
    }

    if (club.maxMembers && club.members.length >= club.maxMembers) {
      throw new Error("Member limit reached");
    }
  }

  async updateClubMembers(memberIds, clubId) {
    const club = await clubService.getClubById(clubId);
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

module.exports = new ClubMembershipService();
// This service handles club membership related operations such as removing a member, fetching club members, and updating club members.
