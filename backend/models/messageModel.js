import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, trim: true },
  isRead: { type: Boolean, default: false },
  timestamps: true,
});
const messageModel = mongoose.model("Message", messageSchema);
