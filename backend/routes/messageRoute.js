import express from "express";
import {
  sendMessage,
  allMessages,
  markMessagesRead,
  getUnreadCount,
} from "../controllers/messageController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/authUser.js";

const messageRouter = express.Router();

const verifySender = (req, res, next) => {
  const { isAdmin } = req.body;

  if (isAdmin) {
    return adminAuth(req, res, next);
  } else {
    return authUser(req, res, next);
  }
};

messageRouter.post("/send", verifySender, sendMessage);
messageRouter.get("/:chatId", allMessages);
messageRouter.post("/mark-read", verifySender, markMessagesRead);
messageRouter.get("/unread/:chatId", getUnreadCount);

export default messageRouter;
