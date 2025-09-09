import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import validateEnv from "./config/env.js";
import { Server } from "socket.io";
import connectCloudinary from "./config/cloudinary.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRouter.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import chatRouter from "./routes/chatRoute.js";
import messageRouter from "./routes/messageRoute.js";
import priceRequestRouter from "./routes/priceRequestRouter.js";

// Validate environment variables
validateEnv();

const app = express();
const port = process.env.PORT || 4000;

// Connect to databases
connectDB();
connectCloudinary();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Request logging
app.use(requestLogger);

// Apply auth rate limiting to auth routes
app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/admin", authLimiter);

// Routes
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/price-requests", priceRequestRouter);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "API is working",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🚀 Server started on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Socket.io configuration with proper CORS
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected: " + socket.id);

  socket.on("setup", (userData) => {
    if (userData._id === "admin") {
      socket.join("admin");
    } else {
      socket.join(userData._id);
    }
    socket.emit("connection");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat room: " + room);
  });

  socket.on("new Message", (newMessageReceived) => {
    const chatId = newMessageReceived.message.chatId;
    const sender = newMessageReceived.message.sender;

    io.to(chatId).emit("message received", newMessageReceived.message);

    if (sender === "user") {
      io.to("admin").emit("unread update", { chatId });
    } else {
      io.to(newMessageReceived.message.chatId).emit("unread update", {
        chatId,
      });
    }
  });

  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });

  socket.on("stop typing", (chatId) => {
    socket.to(chatId).emit("stop typing");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected: " + socket.id);
  });
});
