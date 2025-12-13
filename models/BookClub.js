const mongoose = require("mongoose");

const bookClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: { type: String },

    location: {
      address: String,
      city: String,
      canton: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      venueType: {
        type: String,
        enum: ["online", "hybrid", "in-person"],
      },
      ethLibraryId: String,
    },

    meetingTime: Date,
    maxMembers: { type: Number, default: 20 },
    currentBooks: [
      {
        title: String,
        author: String,
        isbn: String,
        language: {
          type: String,
          enum: ["en", "de", "fr", "it"],
          default: "en",
        },
        clubProgress: {
          status: {
            type: String,
            enum: ["planned", "reading", "discussing", "completed"],
            default: "not_started",
          },
          startedAt: Date,
          targetFinishAt: Date,
          currentChapter: Number,
        },
      },
    ],

    bookHistory: [
      {
        title: String,
        author: String,
        completedAt: Date,
        clubRating: Number,
      },
    ],

    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
      },
    ],

    genre: {
      type: String,
      enum: ["fiction", "non-fiction", "mystery", "fantasy", "biography"],
      default: "fiction",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },

    isPrivate: { type: Boolean, default: false },

    meetingFrequency: {
      type: String,
      enum: ["weekly", "bi-weekly", "monthly", "quarterly"],
      default: "monthly",
    },

    // LOCALIZATION:
    language: { type: String, enum: ["en", "de", "fr", "it"], default: "en" },
  },
  {
    timestamps: true,
  }
);

// ADD INDEXES FOR SWISS SEARCH:
bookClubSchema.index({ "location.canton": 1, "location.city": 1 });
bookClubSchema.index({ tags: 1 });
bookClubSchema.index({ language: 1 });

module.exports = mongoose.model("BookClub", bookClubSchema);
