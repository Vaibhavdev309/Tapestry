import express from "express";
import {
  createPriceRequest,
  getCurrentRequest,
  getAdminRequests,
  approveRequest,
  rejectRequest,
} from "../controllers/priceRequestController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/authUser.js";

const priceRequestRouter = express.Router();

// User routes
priceRequestRouter.post("/create", authUser, createPriceRequest);
priceRequestRouter.get("/current", authUser, getCurrentRequest);

// Admin routes
priceRequestRouter.get("/admin", adminAuth, getAdminRequests);
priceRequestRouter.post("/approve/:id", adminAuth, approveRequest);
priceRequestRouter.post("/reject/:id", adminAuth, rejectRequest);

export default priceRequestRouter;
