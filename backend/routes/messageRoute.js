import express from "express";

const messageRouter = express.Router();

messageRouter.post("/", sendMessage);
messageRouter.get("/:chatId", getMessages);

export default messageRouter;
