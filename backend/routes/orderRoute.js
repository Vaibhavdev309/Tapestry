import express from "express";
import {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/authUser.js";

const orderRouter = express.Router();

orderRouter.post("/placeorder", authUser, placeOrder);
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/userorders", authUser, userOrders);
orderRouter.post("/status", adminAuth, updateStatus);

export default orderRouter;
