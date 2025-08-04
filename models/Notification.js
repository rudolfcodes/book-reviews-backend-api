const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Optional, null for system notifications
      default: null,
    },
    type: {
      type: String,
      enum: [
        "book_club_invite",
        "book_club_rsvp",
        "swap_request",
        "swap_accepted",
        "swap_declined",
        "chat_message",
        "meeting_reminder",
        "system_announcement",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedBookClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookClub",
    },
    relatedBookSwap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookSwap",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    language: {
      type: String,
      enum: ["en", "de", "fr"],
      default: "en",
    },
    sentViaEmail: { type: Boolean, default: false },
    sentViaPush: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);
// Indexes needed:
// - recipient + isRead + createdAt (for user notification queries)
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
