import messageModel from "../models/messageModel.js";
import chatModel from "../models/chatModel.js";

const sendMessage = async (req, res) => {
  try {
    const { chatId, content, isAdmin } = req.body;
    if (!chatId || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Chat ID and content are required" });
    }

    const chat = await chatModel.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const sender = isAdmin ? "admin" : "user";
    const newMessage = await messageModel.create({
      chatId,
      content,
      sender,
      read: false,
    });

    chat.latestMessage = newMessage._id;
    chat.updatedAt = Date.now();
    await chat.save();

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const allMessages = async (req, res) => {
  try {
    const messages = await messageModel.find({ chatId: req.params.chatId });
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markMessagesRead = async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res
        .status(400)
        .json({ success: false, message: "Chat ID is required" });
    }

    await messageModel.updateMany(
      { chatId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await messageModel.countDocuments({
      chatId: req.params.chatId,
      read: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { sendMessage, allMessages, markMessagesRead, getUnreadCount };
