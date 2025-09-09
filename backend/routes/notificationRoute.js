import express from "express";
import {
  sendTestEmail,
  getEmailPreferences,
  updateEmailPreferences,
  sendManualNotification,
  getNotificationHistory,
  markNotificationAsRead,
  getEmailStatistics,
} from "../controllers/notificationController.js";
import authUser from "../middleware/authUser.js";
import adminAuth from "../middleware/adminAuth.js";

const notificationRouter = express.Router();

// User routes (protected)
notificationRouter.get("/preferences", authUser, getEmailPreferences);
notificationRouter.put("/preferences", authUser, updateEmailPreferences);
notificationRouter.get("/history", authUser, getNotificationHistory);
notificationRouter.put("/read/:notificationId", authUser, markNotificationAsRead);

// Admin routes (protected)
notificationRouter.post("/test", adminAuth, sendTestEmail);
notificationRouter.post("/send", adminAuth, sendManualNotification);
notificationRouter.get("/statistics", adminAuth, getEmailStatistics);

export default notificationRouter;