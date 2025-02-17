import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, enum: ["user", "admin"], required: true },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const notificationModel = mongoose.model("Notification", notificationSchema);

export default notificationModel;
