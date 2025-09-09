import express from "express";
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  flagReview,
  getTopRatedProducts,
  getPendingReviews,
  getFlaggedReviews,
  moderateReview,
  addBusinessResponse,
  getReviewStatistics,
} from "../controllers/reviewController.js";
import authUser from "../middleware/authUser.js";
import adminAuth from "../middleware/adminAuth.js";

const reviewRouter = express.Router();

// Public routes
reviewRouter.get("/product/:productId", getProductReviews);
reviewRouter.get("/top-rated", getTopRatedProducts);

// User routes (protected)
reviewRouter.post("/", authUser, createReview);
reviewRouter.get("/user", authUser, getUserReviews);
reviewRouter.put("/:reviewId", authUser, updateReview);
reviewRouter.delete("/:reviewId", authUser, deleteReview);
reviewRouter.post("/:reviewId/helpful", authUser, markHelpful);
reviewRouter.post("/:reviewId/flag", authUser, flagReview);

// Admin routes (protected)
reviewRouter.get("/admin/pending", adminAuth, getPendingReviews);
reviewRouter.get("/admin/flagged", adminAuth, getFlaggedReviews);
reviewRouter.put("/admin/:reviewId/moderate", adminAuth, moderateReview);
reviewRouter.post("/admin/:reviewId/response", adminAuth, addBusinessResponse);
reviewRouter.get("/admin/statistics", adminAuth, getReviewStatistics);

export default reviewRouter;