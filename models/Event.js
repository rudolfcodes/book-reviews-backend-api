const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookClub",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
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
        enum: ["library", "cafe", "home", "park", "in-person", "online"],
      },
      ethLibraryId: String, // From ETH Library API
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      title: String,
      author: String,
      thumbnail: String,
      googleBooksId: String,
    },
    attendees: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rsvpStatus: {
          type: String,
          enum: ["attending", "maybe", "not_attending", "pending"],
          default: "pending",
        },
        rsvpAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxAttendees: {
      type: Number,
      required: true,
      min: 1,
      default: 20,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    language: { type: String, enum: ["en", "de", "fr"], default: "en" },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Indexes needed for Event:
eventSchema.index({ clubId: 1, date: 1 }); // For upcoming events in a club
eventSchema.index({ date: 1, status: 1 }); // For user's created events

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
