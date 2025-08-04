const mongoose = require("mongoose");
const chatMessageSchema = new mongoose.Schema(
  {
    // - bookClubId: reference to BookClub
    bookClubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookClub",
      required: true,
    },
    // - sender: reference to User
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "book_reference"],
      default: "text",
    },
    // - referencedBook: optional reference to Book
    referencedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
    // - replyTo: reference to parent ChatMessage
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
    // - timestamps: createdAt, updatedAt
    timestamps: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);
//
// Indexes needed:
// - bookClubId + createdAt (for chat history queries)
chatMessageSchema.index({ bookClubId: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
module.exports = ChatMessage;
