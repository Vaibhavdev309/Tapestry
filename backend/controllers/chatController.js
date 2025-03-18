import chatModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "Invalid user id" });
    }

    let chat = await chatModel
      .findOne({ userId })
      .populate("userId", "name email");

    if (!chat) {
      chat = await chatModel.create({ userId });
      chat = await chatModel.findById(chat._id).populate({
        path: "userId",
        select: "name email",
      });
    }
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchUser = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.json({ success: false, message: "Invalid search query" });
    }

    const users = await userModel
      .find({
        name: { $regex: search, $options: "i" },
      })
      .select("name email");

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const fetchChats = async (req, res) => {
  try {
    const chats = await chatModel
      .find()
      .populate("userId", "name email")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { accessChat, searchUser, fetchChats };
