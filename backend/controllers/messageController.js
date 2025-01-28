const sendMessage = async (req, res) => {
    try {
        const { chatId, message } = req.body;
    
        if (!chatId || !mes sage) {
        return res.json({ success: false, message: "Invalid message" });
        }
    
        const chat = await chatModel.findById(chatId);
    
        if (!chat) {
        return res.json({ success: false, message: "Invalid chat id" });
        }
    
        const newMessage = await messageModel.create({
        chatId,
        message,
        sender: req.user._id,
        });
    
        chat.latestMessage = newMessage._id;
        chat.updatedAt = Date.now();
        await chat.save();
    
        res.json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
    