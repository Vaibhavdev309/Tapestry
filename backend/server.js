import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import { Server } from "socket.io";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRouter.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import chatRouter from "./routes/chatRoute.js";
import messageRouter from "./routes/messageRoute.js";

//App config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());
app.use(cors());

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

//API Endpoints
app.get("/", (req, res) => {
  res.send("API working");
});

const server = app.listen(port, () => {
  console.log("Server started on port : " + port);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected: " + socket.id);
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log("User joined room: " + userData._id);
    socket.emit("connection");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat room: " + room);
  });
  socket.on("new Message", (newMessageReceived) => {
    const chatId = newMessageReceived.message.chatId; // Use chatId from the message

    // Broadcast the message to all clients in the chat room
    socket.to(chatId).emit("message received", newMessageReceived.message);
  });
  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing"); // Remove chatId from the payload
  });

  socket.on("stop typing", (chatId) => {
    socket.to(chatId).emit("stop typing"); // Remove chatId from the payload
  });
});
