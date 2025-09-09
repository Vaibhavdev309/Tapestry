import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
} from "../controllers/userController.js";
import { accessChat } from "../controllers/chatController.js";
import authUser from "../middleware/authUser.js";
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validateAdminLogin 
} from "../middleware/validation.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", validateUserRegistration, registerUser);
userRouter.post("/login", validateUserLogin, loginUser);
userRouter.post("/admin", validateAdminLogin, adminLogin);

// Protected routes
userRouter.post("/chat", authUser, accessChat);

export default userRouter;
