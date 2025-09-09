import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  processRefund,
  getRazorpayKey,
  razorpayWebhook,
} from "../controllers/paymentController.js";
import authUser from "../middleware/authUser.js";
import adminAuth from "../middleware/adminAuth.js";
import { validateOrder } from "../middleware/validation.js";

const paymentRouter = express.Router();

// Public routes
paymentRouter.get("/razorpay-key", getRazorpayKey);
paymentRouter.post("/webhook", razorpayWebhook);

// User routes (protected)
paymentRouter.post("/create-order", authUser, validateOrder, createRazorpayOrder);
paymentRouter.post("/verify", authUser, verifyRazorpayPayment);
paymentRouter.get("/status/:orderId", authUser, getPaymentStatus);

// Admin routes (protected)
paymentRouter.post("/refund/:orderId", adminAuth, processRefund);

export default paymentRouter;