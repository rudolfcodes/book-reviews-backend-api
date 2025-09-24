const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middlewares/auth");

// Routes that require authentication:
router.get("/", auth, notificationController.getUserNotifications);
router.put("/:id/read", auth, notificationController.markAsRead);
router.put("/mark-all-read", auth, notificationController.markAllAsRead);
router.put(
  "/preferences",
  auth,
  notificationController.updateNotificationPreferences
);

module.exports = router;
