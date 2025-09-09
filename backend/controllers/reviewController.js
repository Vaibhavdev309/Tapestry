import Review from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import emailService from "../services/emailService.js";

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, size, orderId, images } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!productId || !rating || !title || !comment || !size) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating, title, comment, and size are required"
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5"
      });
    }

    // Check if product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has already reviewed this product with this size
    const existingReview = await Review.findOne({
      userId,
      productId,
      size
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product in this size"
      });
    }

    // Verify order if provided
    let verifiedPurchase = false;
    if (orderId) {
      const order = await orderModel.findOne({
        _id: orderId,
        userId,
        status: { $in: ['delivered', 'processing', 'shipped'] }
      });

      if (order) {
        // Check if the order contains this product and size
        const orderItem = order.items.find(
          item => item.productId.toString() === productId && item.size === size
        );

        if (orderItem) {
          verifiedPurchase = true;
        }
      }
    }

    // Create review
    const reviewData = {
      userId,
      productId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      size,
      orderId: orderId || null,
      verifiedPurchase,
      images: images || []
    };

    const review = new Review(reviewData);
    await review.save();

    // Populate user information for response
    await review.populate('userId', 'name email');

    // Update product review statistics
    await product.updateReviewStats();

    // Send notification email to admin for new review
    emailService.sendAdminNotificationEmail(
      'New Product Review',
      `A new review has been submitted for ${product.name} by ${req.user.name}. Rating: ${rating}/5`,
      null
    ).catch(error => {
      console.error("Failed to send review notification email:", error);
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: {
        id: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        size: review.size,
        verifiedPurchase: review.verifiedPurchase,
        status: review.status,
        createdAt: review.createdAt,
        user: {
          name: review.userId.name,
          email: review.userId.email
        }
      }
    });

  } catch (error) {
    console.error("Create review error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product in this size"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create review"
    });
  }
};

// Get product reviews
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      rating,
      verifiedOnly = false,
      sortBy = 'helpful'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews
    const reviews = await Review.getProductReviews(productId, {
      rating: rating ? parseInt(rating) : null,
      verifiedOnly: verifiedOnly === 'true',
      sortBy,
      limit: parseInt(limit),
      skip
    });

    // Get review statistics
    const stats = await Review.getProductStats(productId);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      productId,
      status: 'approved'
    });

    res.json({
      success: true,
      reviews,
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { five: 0, four: 0, three: 0, two: 0, one: 0 },
        verifiedReviews: 0,
        totalHelpful: 0
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalReviews / parseInt(limit)),
        total: totalReviews
      }
    });

  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product reviews"
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status = 'approved' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.getUserReviews(userId, {
      status,
      limit: parseInt(limit),
      skip
    });

    const totalReviews = await Review.countDocuments({ userId, status });

    res.json({
      success: true,
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalReviews / parseInt(limit)),
        total: totalReviews
      }
    });

  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user reviews"
    });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to update it"
      });
    }

    // Check if review can be updated (only pending or approved reviews)
    if (review.status === 'rejected' || review.status === 'flagged') {
      return res.status(400).json({
        success: false,
        message: "This review cannot be updated"
      });
    }

    // Update review fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer between 1 and 5"
        });
      }
      review.rating = rating;
    }

    if (title !== undefined) {
      review.title = title.trim();
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    if (images !== undefined) {
      review.images = images;
    }

    // Reset status to pending if significant changes made
    if (rating !== review.rating || title !== review.title || comment !== review.comment) {
      review.status = 'pending';
    }

    await review.save();

    // Update product review statistics
    const product = await productModel.findById(review.productId);
    if (product) {
      await product.updateReviewStats();
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      review: {
        id: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        status: review.status,
        updatedAt: review.updatedAt
      }
    });

  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review"
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it"
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update product review statistics
    const product = await productModel.findById(review.productId);
    if (product) {
      await product.updateReviewStats();
    }

    res.json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
};

// Mark review as helpful
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    if (review.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Only approved reviews can be marked as helpful"
      });
    }

    // Check if user already marked this review as helpful
    const isHelpful = review.helpful.users.includes(userId);

    if (isHelpful) {
      await review.removeHelpful(userId);
      res.json({
        success: true,
        message: "Review marked as not helpful",
        helpful: {
          count: review.helpful.count,
          isHelpful: false
        }
      });
    } else {
      await review.markHelpful(userId);
      res.json({
        success: true,
        message: "Review marked as helpful",
        helpful: {
          count: review.helpful.count,
          isHelpful: true
        }
      });
    }

  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark review as helpful"
    });
  }
};

// Flag review
export const flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, comment } = req.body;
    const userId = req.user.id;

    const validReasons = ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Reason must be one of: ${validReasons.join(', ')}`
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    await review.flagReview(userId, reason, comment || '');

    res.json({
      success: true,
      message: "Review flagged successfully"
    });

  } catch (error) {
    console.error("Flag review error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to flag review"
    });
  }
};

// Get top rated products
export const getTopRatedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Review.getTopRatedProducts(parseInt(limit));

    res.json({
      success: true,
      products: topProducts
    });

  } catch (error) {
    console.error("Get top rated products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get top rated products"
    });
  }
};

// Admin: Get pending reviews
export const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ status: 'pending' })
      .populate('userId', 'name email')
      .populate('productId', 'name image')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalReviews = await Review.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalReviews / parseInt(limit)),
        total: totalReviews
      }
    });

  } catch (error) {
    console.error("Get pending reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending reviews"
    });
  }
};

// Admin: Get flagged reviews
export const getFlaggedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ status: 'flagged' })
      .populate('userId', 'name email')
      .populate('productId', 'name image')
      .sort({ 'flags.flaggedAt': -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalReviews = await Review.countDocuments({ status: 'flagged' });

    res.json({
      success: true,
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalReviews / parseInt(limit)),
        total: totalReviews
      }
    });

  } catch (error) {
    console.error("Get flagged reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get flagged reviews"
    });
  }
};

// Admin: Moderate review
export const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject'
    const adminId = req.admin.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'approve' or 'reject'"
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    review.status = action === 'approve' ? 'approved' : 'rejected';
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    review.moderationReason = reason || null;

    await review.save();

    // Update product review statistics
    const product = await productModel.findById(review.productId);
    if (product) {
      await product.updateReviewStats();
    }

    res.json({
      success: true,
      message: `Review ${action}d successfully`,
      review: {
        id: review._id,
        status: review.status,
        moderatedAt: review.moderatedAt,
        moderationReason: review.moderationReason
      }
    });

  } catch (error) {
    console.error("Moderate review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to moderate review"
    });
  }
};

// Admin: Add business response
export const addBusinessResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const adminId = req.admin.id;

    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Response is required"
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    if (review.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Can only respond to approved reviews"
      });
    }

    await review.addBusinessResponse(response.trim(), adminId);

    res.json({
      success: true,
      message: "Business response added successfully",
      businessResponse: review.businessResponse
    });

  } catch (error) {
    console.error("Add business response error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add business response"
    });
  }
};

// Get review statistics
export const getReviewStatistics = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          pendingReviews: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedReviews: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedReviews: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          flaggedReviews: {
            $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
          },
          verifiedReviews: {
            $sum: { $cond: [{ $eq: ['$verifiedPurchase', true] }, 1, 0] }
          },
          totalHelpful: { $sum: '$helpful.count' }
        }
      }
    ]);

    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      rejectedReviews: 0,
      flaggedReviews: 0,
      verifiedReviews: 0,
      totalHelpful: 0
    };

    res.json({
      success: true,
      statistics: {
        ...result,
        averageRating: Math.round(result.averageRating * 10) / 10
      }
    });

  } catch (error) {
    console.error("Get review statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get review statistics"
    });
  }
};