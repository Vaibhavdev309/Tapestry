import chatModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
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
    res.status(500).json({ 
      success: false, 
      message: "Failed to access chat" 
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: "Search query must be at least 2 characters" 
      });
    }

    const users = await userModel
      .find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ],
        isActive: true
      })
      .select("name email")
      .limit(10);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to search users" 
    });
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
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch chats" 
    });
  }
};

export { accessChat, searchUser, fetchChats };
