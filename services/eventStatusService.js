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

  async getEventStats() {
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ status: "upcoming" });
    const completedEvents = await Event.countDocuments({ status: "completed" });
    const cancelledEvents = await Event.countDocuments({ status: "cancelled" });
    const ongoingEvents = await Event.countDocuments({ status: "ongoing" });

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      cancelledEvents,
      ongoingEvents,
    };
  }

  async cancelEvent(eventId, userId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    if (event.createdBy.toString() !== userId.toString()) {
      throw new Error("Only the event creator can cancel the event");
    }
    if (event.status === "completed" || event.status === "cancelled") {
      throw new Error("Cannot cancel a completed or already cancelled event");
    }
    event.status = "cancelled";
    await event.save();
    return event;
  }
}

module.exports = new EventStatusService();
