const { sendError, sendSuccess } = require("../utils/responseHelper");
const eventStatusService = require("../services/eventStatusService");

exports.updateExpiredEvents = async (req, res, next) => {
  try {
    const updatedCount = await eventStatusService.updateExpiredEvents();
    sendSuccess(
      res,
      { updatedCount },
      "Expired events updated successfully",
      200
    );
  } catch (error) {
    sendError(res, error, 500, "Failed to update expired events");
    next(error);
  }
};
