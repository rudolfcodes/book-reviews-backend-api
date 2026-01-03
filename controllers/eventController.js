const { sendError, sendSuccess } = require("../utils/responseHelper");
const eventService = require("../services/eventService");

exports.getEvents = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const {
      currentPage = 1,
      pageSize = 10,
      limit = 10,
      sortBy = "date",
      location,
      language,
      title,
      dateRange,
    } = req.query;

    const filters = { location, language, title, dateRange };
    const options = {
      page: parseInt(currentPage, 10),
      limit: parseInt(pageSize, 10) || parseInt(limit, 10),
      sortBy,
    };
    const events = await eventService.getEvents(
      { clubId, ...filters },
      options
    );

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }
    sendSuccess(res, events, "Events fetched successfully", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to fetch events");
    next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const clubId = req.params.clubId;

    const isOwner = req.user.clubsCreated.includes(clubId);
    if (!isOwner) {
      return sendError(
        res,
        "You are not authorized to create events for this book club"
      );
    }

    const event = {
      ...req.body,
      userId: userId,
      clubId: clubId,
      attendees: [userId],
      createdBy: userId,
    };
    const newEvent = await eventService.createEvent(event);
    sendSuccess(res, newEvent, "Event created successfully", 201);
  } catch (error) {
    sendError(res, error, 500, "Failed to create event");
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const { clubId, eventId } = req.params;

    const event = await eventService.getEventById(eventId);
    if (!event || event.clubId.toString() !== clubId) {
      return sendError(res, "Event not found in this book club", 404);
    }
    const isOwner = req.user.clubsCreated.includes(clubId);
    if (!isOwner) {
      return sendError(
        res,
        "You are not authorized to update events for this book club"
      );
    }

    const updatedEvent = await eventService.updateEvent(eventId, req.body);
    sendSuccess(res, updatedEvent, "Event updated successfully", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to update event");
    next(error);
  }
};

exports.cancelEvent = async (req, res, next) => {
  try {
    const { eventId, clubId } = req.params;
    const event = await eventService.getEventById(eventId);
    if (!event || event.clubId.toString() !== clubId) {
      return sendError(res, "Event not found in this book club", 404);
    }
    const isOwner = req.user.clubsCreated.includes(clubId);
    if (!isOwner) {
      return sendError(
        res,
        "You are not authorized to cancel events for this book club"
      );
    }

    await eventService.cancelEvent(eventId);
    sendSuccess(res, null, "Event cancelled successfully", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to cancel event");
    next(error);
  }
};

exports.rsvpToEvent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { clubId, eventId } = req.params;
    const { rsvpStatus } = req.body;

    const isMember = req.user.clubsJoined.includes(clubId);
    if (!isMember) {
      return sendError(
        res,
        "You are not a member of this book club yet. Join the club to RSVP to events."
      );
    }

    const updatedEvent = await eventService.rsvpToEvent(
      userId,
      eventId,
      rsvpStatus
    );

    sendSuccess(res, updatedEvent, "RSVP updated successfully", 200);
  } catch (error) {
    sendError(res, error, 500, "Failed to RSVP to event");
    next(error);
  }
};
