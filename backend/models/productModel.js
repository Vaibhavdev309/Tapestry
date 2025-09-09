import mongoose from "mongoose";

// Size-specific inventory schema
const sizeInventorySchema = new mongoose.Schema({
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 }, // Reserved for pending orders
  lowStockThreshold: { type: Number, default: 10 }, // Alert when stock goes below this
  lastUpdated: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  image: { 
    type: Array, 
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one image is required'
    }
  },
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  subCategory: { 
    type: String, 
    required: true,
    trim: true
  },
  sizes: { 
    type: Array, 
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one size is required'
    }
  },
  bestSeller: { 
    type: Boolean,
    default: false
  },
  date: { 
    type: Number, 
    required: true 
  },
  
  // Inventory Management Fields
  inventory: {
    totalStock: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    availableStock: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    reservedStock: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    sizeInventory: [sizeInventorySchema],
    lowStockAlert: { 
      type: Boolean, 
      default: false 
    },
    outOfStock: { 
      type: Boolean, 
      default: false 
    },
    lastStockUpdate: { 
      type: Date, 
      default: Date.now 
    },
    stockHistory: [{
      date: { type: Date, default: Date.now },
      type: { 
        type: String, 
        enum: ['in', 'out', 'adjustment', 'reserved', 'released'],
        required: true 
      },
      quantity: { type: Number, required: true },
      size: String,
      reason: String,
      orderId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId,
    }]
  },
  
  // Product Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'active'
  },
  
  // SEO and Marketing
  sku: { 
    type: String, 
    unique: true,
    sparse: true
  },
  tags: [String],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  
  // Analytics
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  lastSold: Date,
  
  // Review Statistics
  reviews: {
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingDistribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    },
    verifiedReviews: { type: Number, default: 0 },
    lastReviewDate: Date
  },
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'inventory.outOfStock': 1 });
productSchema.index({ 'inventory.lowStockAlert': 1 });
productSchema.index({ sku: 1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware to generate SKU and update inventory totals
productSchema.pre('save', function(next) {
  // Generate SKU if not provided
  if (!this.sku) {
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `${categoryPrefix}-${randomSuffix}`;
  }
  
  // Update inventory totals
  if (this.inventory && this.inventory.sizeInventory) {
    this.inventory.totalStock = this.inventory.sizeInventory.reduce((total, size) => total + size.quantity, 0);
    this.inventory.availableStock = this.inventory.sizeInventory.reduce((total, size) => total + (size.quantity - size.reserved), 0);
    this.inventory.reservedStock = this.inventory.sizeInventory.reduce((total, size) => total + size.reserved, 0);
    
    // Check for low stock and out of stock
    this.inventory.lowStockAlert = this.inventory.sizeInventory.some(size => size.quantity <= size.lowStockThreshold);
    this.inventory.outOfStock = this.inventory.totalStock === 0;
    
    // Update product status based on stock
    if (this.inventory.outOfStock) {
      this.status = 'out_of_stock';
    } else if (this.status === 'out_of_stock' && this.inventory.totalStock > 0) {
      this.status = 'active';
    }
    
    this.inventory.lastStockUpdate = new Date();
  }
  
  next();
});

// Instance methods
productSchema.methods.updateStock = function(size, quantity, type, reason, orderId, userId) {
  const sizeInventory = this.inventory.sizeInventory.find(s => s.size === size);
  
  if (!sizeInventory) {
    throw new Error(`Size ${size} not found for product ${this.name}`);
  }
  
  let newQuantity = sizeInventory.quantity;
  
  switch (type) {
    case 'in':
      newQuantity += quantity;
      break;
    case 'out':
      if (newQuantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${newQuantity}, Requested: ${quantity}`);
      }
      newQuantity -= quantity;
      break;
    case 'reserved':
      if (sizeInventory.quantity - sizeInventory.reserved < quantity) {
        throw new Error(`Insufficient available stock. Available: ${sizeInventory.quantity - sizeInventory.reserved}, Requested: ${quantity}`);
      }
      sizeInventory.reserved += quantity;
      break;
    case 'released':
      if (sizeInventory.reserved < quantity) {
        throw new Error(`Cannot release more than reserved. Reserved: ${sizeInventory.reserved}, Requested: ${quantity}`);
      }
      sizeInventory.reserved -= quantity;
      break;
    case 'adjustment':
      newQuantity = quantity;
      break;
    default:
      throw new Error(`Invalid stock update type: ${type}`);
  }
  
  // Update quantity for non-reservation operations
  if (type !== 'reserved' && type !== 'released') {
    sizeInventory.quantity = newQuantity;
  }
  
  sizeInventory.lastUpdated = new Date();
  
  // Add to stock history
  this.inventory.stockHistory.push({
    date: new Date(),
    type,
    quantity,
    size,
    reason,
    orderId,
    userId
  });
  
  // Keep only last 100 stock history entries
  if (this.inventory.stockHistory.length > 100) {
    this.inventory.stockHistory = this.inventory.stockHistory.slice(-100);
  }
  
  return this.save();
};

productSchema.methods.checkStock = function(size, quantity) {
  const sizeInventory = this.inventory.sizeInventory.find(s => s.size === size);
  
  if (!sizeInventory) {
    return { available: 0, reserved: 0, total: 0 };
  }
  
  return {
    available: sizeInventory.quantity - sizeInventory.reserved,
    reserved: sizeInventory.reserved,
    total: sizeInventory.quantity
  };
};

productSchema.methods.getLowStockSizes = function() {
  return this.inventory.sizeInventory.filter(size => 
    size.quantity <= size.lowStockThreshold
  );
};

// Static methods
productSchema.statics.getLowStockProducts = function() {
  return this.find({
    'inventory.lowStockAlert': true,
    status: { $ne: 'discontinued' }
  });
};

productSchema.statics.getOutOfStockProducts = function() {
  return this.find({
    'inventory.outOfStock': true,
    status: { $ne: 'discontinued' }
  });
};

productSchema.statics.getInventoryReport = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$inventory.totalStock' },
        totalAvailable: { $sum: '$inventory.availableStock' },
        totalReserved: { $sum: '$inventory.reservedStock' },
        lowStockCount: {
          $sum: {
            $cond: [{ $eq: ['$inventory.lowStockAlert', true] }, 1, 0]
          }
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $eq: ['$inventory.outOfStock', true] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Method to update review statistics
productSchema.methods.updateReviewStats = async function() {
  const Review = mongoose.model('Review');
  
  const stats = await Review.getProductStats(this._id);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.reviews = {
      totalReviews: stat.totalReviews,
      averageRating: stat.averageRating,
      ratingDistribution: stat.ratingDistribution,
      verifiedReviews: stat.verifiedReviews,
      lastReviewDate: new Date()
    };
  } else {
    this.reviews = {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { five: 0, four: 0, three: 0, two: 0, one: 0 },
      verifiedReviews: 0,
      lastReviewDate: null
    };
  }
  
  return this.save();
};

const productModel =
  mongoose.models.product || mongoose.model("Product", productSchema);

export default productModel;
