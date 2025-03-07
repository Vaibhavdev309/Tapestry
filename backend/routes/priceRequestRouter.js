import express from "express";
import {
  createPriceRequest,
  getCurrentRequest,
  getAdminRequests,
  approveRequest,
  rejectRequest,
  getUserRequests,
  getRequest,
} from "../controllers/priceRequestController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/authUser.js";

const priceRequestRouter = express.Router();

// User routes
priceRequestRouter.post("/create", authUser, createPriceRequest);
priceRequestRouter.get("/current", authUser, getCurrentRequest);
priceRequestRouter.get("/user", authUser, getUserRequests);
priceRequestRouter.get("/user/:id", authUser, getRequest);
// Admin routes
priceRequestRouter.get("/admin", adminAuth, getAdminRequests);
priceRequestRouter.post("/approve/:id", adminAuth, approveRequest);
priceRequestRouter.post("/reject/:id", adminAuth, rejectRequest);

export default priceRequestRouter;
