import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Product information
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  
  // Order information (optional - for verified purchases)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Review images
  images: [{
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Review metadata
  size: {
    type: String,
    required: true
  },
  
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  
  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Moderation
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  
  moderatedAt: {
    type: Date,
    default: null
  },
  
  moderationReason: {
    type: String,
    default: null
  },
  
  // Flags and reports
  flags: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { 
      type: String, 
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant'],
      required: true 
    },
    comment: String,
    flaggedAt: { type: Date, default: Date.now }
  }],
  
  // Analytics
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  
  // SEO and search
  tags: [String],
  
  // Response from business
  businessResponse: {
    response: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1, productId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ verifiedPurchase: 1 });
reviewSchema.index({ 'helpful.count': -1 });

// Compound index to prevent duplicate reviews
reviewSchema.index({ userId: 1, productId: 1, size: 1 }, { unique: true });

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Auto-approve reviews with 4+ stars and no flags
  if (this.rating >= 4 && this.flags.length === 0 && this.status === 'pending') {
    this.status = 'approved';
  }
  
  // Mark as verified purchase if orderId is provided
  if (this.orderId && !this.verifiedPurchase) {
    this.verifiedPurchase = true;
  }
  
  next();
});

// Instance methods
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.removeHelpful = function(userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.flagReview = function(userId, reason, comment = '') {
  // Check if user already flagged this review
  const existingFlag = this.flags.find(flag => flag.userId.toString() === userId.toString());
  if (existingFlag) {
    throw new Error('You have already flagged this review');
  }
  
  this.flags.push({
    userId,
    reason,
    comment,
    flaggedAt: new Date()
  });
  
  // Auto-flag if multiple users flag the same review
  if (this.flags.length >= 3) {
    this.status = 'flagged';
  }
  
  return this.save();
};

reviewSchema.methods.addBusinessResponse = function(response, respondedBy) {
  this.businessResponse = {
    response,
    respondedBy,
    respondedAt: new Date()
  };
  return this.save();
};

// Static methods
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const {
    status = 'approved',
    rating = null,
    verifiedOnly = false,
    sortBy = 'helpful',
    limit = 10,
    skip = 0
  } = options;
  
  let query = { productId, status };
  
  if (rating) {
    query.rating = rating;
  }
  
  if (verifiedOnly) {
    query.verifiedPurchase = true;
  }
  
  let sort = {};
  switch (sortBy) {
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'rating_high':
      sort = { rating: -1, createdAt: -1 };
      break;
    case 'rating_low':
      sort = { rating: 1, createdAt: -1 };
      break;
    case 'helpful':
    default:
      sort = { 'helpful.count': -1, createdAt: -1 };
      break;
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('moderatedBy', 'name')
    .populate('businessResponse.respondedBy', 'name')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

reviewSchema.statics.getProductStats = function(productId) {
  return this.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: {
            $switch: {
              branches: [
                { case: { $eq: ['$rating', 5] }, then: 'five' },
                { case: { $eq: ['$rating', 4] }, then: 'four' },
                { case: { $eq: ['$rating', 3] }, then: 'three' },
                { case: { $eq: ['$rating', 2] }, then: 'two' },
                { case: { $eq: ['$rating', 1] }, then: 'one' }
              ],
              default: 'unknown'
            }
          }
        },
        verifiedReviews: {
          $sum: { $cond: [{ $eq: ['$verifiedPurchase', true] }, 1, 0] }
        },
        totalHelpful: { $sum: '$helpful.count' }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          five: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 'five'] } } } },
          four: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 'four'] } } } },
          three: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 'three'] } } } },
          two: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 'two'] } } } },
          one: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 'one'] } } } }
        },
        verifiedReviews: 1,
        totalHelpful: 1
      }
    }
  ]);
};

reviewSchema.statics.getUserReviews = function(userId, options = {}) {
  const { status = 'approved', limit = 10, skip = 0 } = options;
  
  return this.find({ userId, status })
    .populate('productId', 'name image price')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

reviewSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending' })
    .populate('userId', 'name email')
    .populate('productId', 'name image')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.getFlaggedReviews = function() {
  return this.find({ status: 'flagged' })
    .populate('userId', 'name email')
    .populate('productId', 'name image')
    .sort({ 'flags.flaggedAt': -1 });
};

reviewSchema.statics.getTopRatedProducts = function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        verifiedReviews: {
          $sum: { $cond: [{ $eq: ['$verifiedPurchase', true] }, 1, 0] }
        }
      }
    },
    { $match: { totalReviews: { $gte: 5 } } }, // Minimum 5 reviews
    { $sort: { averageRating: -1, totalReviews: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        product: {
          name: '$product.name',
          image: '$product.image',
          price: '$product.price',
          category: '$product.category'
        },
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        verifiedReviews: 1
      }
    }
  ]);
};

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;