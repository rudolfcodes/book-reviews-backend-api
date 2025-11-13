const Event = require("../models/Event");

class EventStatusService {
  async updateExpiredEvents() {
    const now = new Date();
    const eventsToUpdate = await Event.find({
      date: { $lt: now },
      status: "upcoming",
    });

    for (const event of eventsToUpdate) {
      event.status = "completed";
      await event.save();
    }

    return eventsToUpdate.length;
  }
}

module.exports = new EventStatusService();
