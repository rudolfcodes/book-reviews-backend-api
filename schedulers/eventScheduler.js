const cron = require("node-cron");
const eventStatusService = require("../services/eventStatusService");

// Schedule the task to run every hour at minute 0
cron.schedule("0 * * * * ", async () => {
  await eventStatusService.updateExpiredEvents();
  console.log("Checked and updated expired events");
});
