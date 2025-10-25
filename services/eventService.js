const Event = require("../models/Event");
const User = require("../models/User");

class EventService {
  async getEvents(filters, options) {
    const { page, limit, sortBy } = options;
    const { location, language, title, dateRange } = filters;
    const filter = {};

    if (location) filter.location = location;
    if (language) filter.language = language;
    if (title) filter.title = { $regex: title, $options: "i" }; // Case-insensitive search
    if (dateRange) {
      filter.date = {};
      if (dateRange.from) filter.date.$gte = new Date(dateRange.from);
      if (dateRange.to) filter.date.$lte = new Date(dateRange.to);
    }

    let sortCriteria;
    switch (sortBy) {
      case "date":
        sortCriteria = { date: 1 };
        break;
      case "newest":
        sortCriteria = { createdAt: -1 };
        break;
      case "oldest":
        sortCriteria = { createdAt: 1 };
        break;
      case "title":
        sortCriteria = { title: 1 };
        break;
      default:
        sortCriteria = { date: 1 };
        break;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalDocs = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limitNum);
    const docs = await Event.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum);

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

  async createEvent(eventData) {
    const newEvent = new Event({
      ...eventData,
    });

    await newEvent.save();
    await User.findByIdAndUpdate(eventData.userId, {
      $push: {
        eventsCreated: newEvent._id,
        eventsAttending: newEvent._id,
      },
    });

    return newEvent;
  }

  async rsvpToEvent(userId, eventId, rsvpStatus) {
    if (!userId || !eventId) {
      throw new Error("User ID and Event ID are required for RSVP.");
    }

    const event = await Event.findByIdAndUpdate(eventId, {
      $pull: { attendees: { userId: new mongoose.Types.ObjectId(userId) } },
    });

    if (!event) {
      throw new Error("Event not found.");
    }

    event.attendees.push({
      userId: userId,
      rsvpStatus: rsvpStatus,
      rsvpAt: new Date(),
    });
    await event.save();

    return event;
  }
}

module.exports = new EventService();
