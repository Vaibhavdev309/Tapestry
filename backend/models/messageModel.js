import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    }, // Reference to the chat
    sender: { type: String, enum: ["user", "admin"], required: true }, // Indicates whether the sender is a user or admin
    content: { type: String, required: true }, // Message content
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;
