import express from "express";
import {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/authUser.js";
import { validateOrder } from "../middleware/validation.js";

const orderRouter = express.Router();

// User routes (protected)
orderRouter.post("/placeorder", authUser, validateOrder, placeOrder);
orderRouter.get("/userorders", authUser, userOrders);

// Admin routes (protected)
orderRouter.get("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);

export default orderRouter;
