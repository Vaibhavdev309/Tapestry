import express from "express";
import { allMessages, sendMessage } from "../controllers/messageController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/authUser.js";

const messageRouter = express.Router();

const verifySender = (req, res, next) => {
  const { isAdmin } = req.body;

  if (isAdmin) {
    return adminAuth(req, res, next); // Apply adminAuth if isAdmin is true
  } else {
    return authUser(req, res, next); // Apply authUser if isAdmin is false
  }
};

messageRouter.post("/send", verifySender, sendMessage);
messageRouter.get("/:chatId", allMessages);

export default messageRouter;
