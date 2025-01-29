import messageModel from "../models/messageModel.js";
import chatModel from "../models/chatModel.js";

const sendMessage = async (req, res) => {
  console.log(req.body);
  try {
    const { chatId, content, isAdmin } = req.body; // isAdmin flag to differentiate sender
    if (!chatId || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid message" });
    }

    const chat = await chatModel.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid chat ID" });
    }

    const sender = isAdmin ? "admin" : "user";

    const newMessage = await messageModel.create({ chatId, content, sender });
    console.log(newMessage);
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export { sendMessage, allMessages };
