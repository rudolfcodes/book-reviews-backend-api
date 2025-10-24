const { sendError, sendSuccess } = require("../utils/responseHelper");
const eventService = require("../services/eventService");

exports.getEvents = async (req, res, next) => {
  try {
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
    const events = await eventService.getEvents(filters, options);

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
