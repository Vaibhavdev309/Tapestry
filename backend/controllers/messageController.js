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

    // Validate content length
    if (content.length > 1000) {
      return res
        .status(400)
        .json({ success: false, message: "Message too long (max 1000 characters)" });
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
      content: content.trim(),
      sender,
      read: false,
    });

    // Update chat with latest message
    chat.latestMessage = newMessage._id;
    await chat.save();

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

const allMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required"
      });
    }

    const messages = await messageModel
      .find({ chatId })
      .sort({ createdAt: 1 });
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch messages" 
    });
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
    
    res.json({ 
      success: true, 
      message: "Messages marked as read" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark messages as read" 
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required"
      });
    }

    const count = await messageModel.countDocuments({
      chatId,
      read: false,
    });
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to get unread count" 
    });
  }
};

export { sendMessage, allMessages, markMessagesRead, getUnreadCount };
