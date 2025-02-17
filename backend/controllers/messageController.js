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

const readMessage = async (req, res) => {
  try {
    const { chatId } = req.body;
    const isAdmin = req.user.isAdmin;

    await Message.updateMany(
      {
        chatId,
        sender: isAdmin ? "user" : "admin",
        read: false,
      },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { sendMessage, allMessages, readMessage };
