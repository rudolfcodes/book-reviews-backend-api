const Notification = require("../models/Notification");

class NotificationService {
  async createNotification(notificationData) {
    return await Notification.create(notificationData);
  }

  async createBulkNotifications(notifications) {
    if (notifications.length > 0) {
      return await Notification.insertMany(notifications);
    }
    return [];
  }

  async notifyClubCreated(userId, clubId, clubName) {
    return this.createNotification({
      recipient: userId,
      type: "system_announcement",
      title: "New Book Club Created",
      message: `You have successfully created the book club "${clubName}".`,
      relatedBookClub: clubId,
    });
  }

  async notifyMemberJoined(adminId, userName, clubName, clubId) {
    return this.createNotification({
      recipient: adminId,
      type: "system_announcement",
      title: "New Member Joined",
      message: `${userName} has joined your book club "${clubName}".`,
      relatedBookClub: clubId,
    });
  }

  async notifyClubUpdated(members, adminId, adminUsername, clubName, clubId) {
    const notifications = members
      .filter((member) => member.userId.toString() !== adminId.toString())
      .map((member) => ({
        recipient: member.userId,
        type: "system_announcement",
        title: "Book Club Updated",
        message: `${adminUsername} has updated the book club "${clubName}".`,
        relatedBookClub: clubId,
      }));
    this.createBulkNotifications(notifications);
    return notifications;
  }

  async notifyClubDeleted(members, adminId, clubName) {
    const notifications = members
      .filter((member) => member.userId.toString() !== adminId.toString())
      .map((member) => ({
        recipient: member.userId,
        type: "system_announcement",
        title: "Book Club Deleted",
        message: `The book club "${clubName}" has been deleted.`,
        relatedBookClub: null, // Club will be deleted, so null reference
      }));
    return this.createBulkNotifications(notifications);
  }
}

module.exports = new NotificationService();
