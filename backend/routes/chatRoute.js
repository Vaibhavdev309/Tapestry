import express from "express";
import data from "../data/data.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  accessChat,
  fetchChats,
  searchUser,
} from "../controllers/chatController.js";
import authUser from "../middleware/authUser.js";

const chatRouter = express.Router();

chatRouter.get("/", (req, res) => {
  res.json(data);
});

chatRouter.get("/searchuser", adminAuth, searchUser);
chatRouter.get("/accesschat", authUser, accessChat);
chatRouter.get("/fetchchats", adminAuth, fetchChats);
chatRouter.post("/accesschat", adminAuth, accessChat);

export default chatRouter;
