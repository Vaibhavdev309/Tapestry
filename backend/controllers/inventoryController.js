import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import emailService from "../services/emailService.js";

// Get inventory overview
export const getInventoryOverview = async (req, res) => {
  try {
    const report = await productModel.getInventoryReport();
    const lowStockProducts = await productModel.getLowStockProducts();
    const outOfStockProducts = await productModel.getOutOfStockProducts();
    
    const overview = {
      summary: report[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalAvailable: 0,
        totalReserved: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      lowStockDetails: lowStockProducts.map(product => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        lowStockSizes: product.getLowStockSizes()
      })),
      outOfStockDetails: outOfStockProducts.map(product => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category
      }))
    };

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error("Get inventory overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get inventory overview"
    });
  }
};

// Get product inventory details
export const getProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const inventory = {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      status: product.status,
      totalStock: product.inventory.totalStock,
      availableStock: product.inventory.availableStock,
      reservedStock: product.inventory.reservedStock,
      lowStockAlert: product.inventory.lowStockAlert,
      outOfStock: product.inventory.outOfStock,
      lastStockUpdate: product.inventory.lastStockUpdate,
      sizeInventory: product.inventory.sizeInventory,
      stockHistory: product.inventory.stockHistory.slice(-20) // Last 20 entries
    };

    res.json({
      success: true,
      inventory
    });

  } catch (error) {
    console.error("Get product inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product inventory"
    });
  }
};

// Update product stock
export const updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, quantity, type, reason } = req.body;

    if (!size || quantity === undefined || !type) {
      return res.status(400).json({
        success: false,
        message: "Size, quantity, and type are required"
      });
    }

    const validTypes = ['in', 'out', 'adjustment', 'reserved', 'released'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if size exists
    const sizeExists = product.inventory.sizeInventory.some(s => s.size === size);
    if (!sizeExists) {
      return res.status(400).json({
        success: false,
        message: `Size ${size} not found for this product`
      });
    }

    // Update stock
    await product.updateStock(
      size, 
      quantity, 
      type, 
      reason || 'Manual adjustment',
      null,
      req.admin?.id || req.user?.id
    );

    // Send low stock alert if needed
    if (product.inventory.lowStockAlert) {
      await emailService.sendAdminNotificationEmail(
        'Low Stock Alert',
        `Product ${product.name} (${product.sku}) has low stock in size ${size}. Current quantity: ${product.inventory.sizeInventory.find(s => s.size === size).quantity}`,
        null
      );
    }

    res.json({
      success: true,
      message: "Stock updated successfully",
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        status: product.status,
        inventory: {
          totalStock: product.inventory.totalStock,
          availableStock: product.inventory.availableStock,
          reservedStock: product.inventory.reservedStock,
          lowStockAlert: product.inventory.lowStockAlert,
          outOfStock: product.inventory.outOfStock
        }
      }
    });

  } catch (error) {
    console.error("Update product stock error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update product stock"
    });
  }
};

// Bulk stock update
export const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required"
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { productId, size, quantity, type, reason } = update;
        
        const product = await productModel.findById(productId);
        if (!product) {
          errors.push({ productId, error: "Product not found" });
          continue;
        }

        await product.updateStock(
          size, 
          quantity, 
          type, 
          reason || 'Bulk update',
          null,
          req.admin?.id || req.user?.id
        );

        results.push({
          productId,
          productName: product.name,
          sku: product.sku,
          size,
          type,
          quantity,
          success: true
        });

      } catch (error) {
        errors.push({
          productId: update.productId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk update completed. ${results.length} successful, ${errors.length} failed`,
      results,
      errors
    });

  } catch (error) {
    console.error("Bulk update stock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk stock update"
    });
  }
};

// Reserve stock for order
export const reserveStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    const reservations = [];
    const errors = [];

    for (const item of items) {
      try {
        const { productId, size, quantity } = item;
        
        const product = await productModel.findById(productId);
        if (!product) {
          errors.push({ productId, error: "Product not found" });
          continue;
        }

        // Check available stock
        const stockInfo = product.checkStock(size, quantity);
        if (stockInfo.available < quantity) {
          errors.push({
            productId,
            productName: product.name,
            size,
            requested: quantity,
            available: stockInfo.available,
            error: "Insufficient stock"
          });
          continue;
        }

        // Reserve stock
        await product.updateStock(
          size, 
          quantity, 
          'reserved', 
          'Order reservation',
          null,
          req.user?.id
        );

        reservations.push({
          productId,
          productName: product.name,
          sku: product.sku,
          size,
          quantity,
          reservedAt: new Date()
        });

      } catch (error) {
        errors.push({
          productId: item.productId,
          error: error.message
        });
      }
    }

    if (errors.length > 0 && reservations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to reserve stock for any items",
        errors
      });
    }

    res.json({
      success: true,
      message: `Stock reserved for ${reservations.length} items`,
      reservations,
      errors
    });

  } catch (error) {
    console.error("Reserve stock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reserve stock"
    });
  }
};

// Release reserved stock
export const releaseStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    const releases = [];
    const errors = [];

    for (const item of items) {
      try {
        const { productId, size, quantity } = item;
        
        const product = await productModel.findById(productId);
        if (!product) {
          errors.push({ productId, error: "Product not found" });
          continue;
        }

        // Release reserved stock
        await product.updateStock(
          size, 
          quantity, 
          'released', 
          'Order cancellation or modification',
          null,
          req.user?.id
        );

        releases.push({
          productId,
          productName: product.name,
          sku: product.sku,
          size,
          quantity,
          releasedAt: new Date()
        });

      } catch (error) {
        errors.push({
          productId: item.productId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Stock released for ${releases.length} items`,
      releases,
      errors
    });

  } catch (error) {
    console.error("Release stock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to release stock"
    });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const { threshold } = req.query;
    const customThreshold = threshold ? parseInt(threshold) : null;

    let query = {
      'inventory.lowStockAlert': true,
      status: { $ne: 'discontinued' }
    };

    const products = await productModel.find(query)
      .select('name sku category inventory.sizeInventory status')
      .sort({ 'inventory.lastStockUpdate': -1 });

    let alerts = [];

    if (customThreshold) {
      // Filter by custom threshold
      products.forEach(product => {
        const lowStockSizes = product.inventory.sizeInventory.filter(size => 
          size.quantity <= customThreshold
        );
        
        if (lowStockSizes.length > 0) {
          alerts.push({
            productId: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            status: product.status,
            lowStockSizes
          });
        }
      });
    } else {
      // Use product's own threshold
      products.forEach(product => {
        const lowStockSizes = product.getLowStockSizes();
        if (lowStockSizes.length > 0) {
          alerts.push({
            productId: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            status: product.status,
            lowStockSizes
          });
        }
      });
    }

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error("Get low stock alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get low stock alerts"
    });
  }
};

// Get inventory reports
export const getInventoryReports = async (req, res) => {
  try {
    const { type, period, category } = req.query;

    let matchStage = {};
    
    if (category) {
      matchStage.category = category;
    }

    if (period) {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      matchStage['inventory.lastStockUpdate'] = { $gte: startDate };
    }

    let pipeline = [{ $match: matchStage }];

    switch (type) {
      case 'stock-movement':
        pipeline.push(
          { $unwind: '$inventory.stockHistory' },
          {
            $match: {
              'inventory.stockHistory.date': {
                $gte: new Date(Date.now() - (parseInt(period) || 30) * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                productId: '$_id',
                productName: '$name',
                sku: '$sku'
              },
              totalIn: {
                $sum: {
                  $cond: [
                    { $eq: ['$inventory.stockHistory.type', 'in'] },
                    '$inventory.stockHistory.quantity',
                    0
                  ]
                }
              },
              totalOut: {
                $sum: {
                  $cond: [
                    { $eq: ['$inventory.stockHistory.type', 'out'] },
                    '$inventory.stockHistory.quantity',
                    0
                  ]
                }
              },
              totalAdjustments: {
                $sum: {
                  $cond: [
                    { $eq: ['$inventory.stockHistory.type', 'adjustment'] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          { $sort: { totalOut: -1 } }
        );
        break;

      case 'category-breakdown':
        pipeline.push(
          {
            $group: {
              _id: '$category',
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
          },
          { $sort: { totalStock: -1 } }
        );
        break;

      case 'top-selling':
        pipeline.push(
          { $sort: { sales: -1 } },
          { $limit: 20 },
          {
            $project: {
              name: 1,
              sku: 1,
              category: 1,
              sales: 1,
              totalStock: '$inventory.totalStock',
              availableStock: '$inventory.availableStock',
              lowStockAlert: '$inventory.lowStockAlert',
              outOfStock: '$inventory.outOfStock'
            }
          }
        );
        break;

      default:
        // Default overview report
        pipeline.push(
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
              },
              averageStock: { $avg: '$inventory.totalStock' }
            }
          }
        );
    }

    const report = await productModel.aggregate(pipeline);

    res.json({
      success: true,
      report,
      filters: {
        type: type || 'overview',
        period: period || 'all',
        category: category || 'all'
      }
    });

  } catch (error) {
    console.error("Get inventory reports error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get inventory reports"
    });
  }
};

// Set low stock threshold
export const setLowStockThreshold = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, threshold } = req.body;

    if (!size || threshold === undefined) {
      return res.status(400).json({
        success: false,
        message: "Size and threshold are required"
      });
    }

    if (threshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Threshold must be a positive number"
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const sizeInventory = product.inventory.sizeInventory.find(s => s.size === size);
    if (!sizeInventory) {
      return res.status(404).json({
        success: false,
        message: `Size ${size} not found for this product`
      });
    }

    sizeInventory.lowStockThreshold = threshold;
    sizeInventory.lastUpdated = new Date();
    
    await product.save();

    res.json({
      success: true,
      message: "Low stock threshold updated successfully",
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        size,
        threshold,
        currentStock: sizeInventory.quantity,
        lowStockAlert: sizeInventory.quantity <= threshold
      }
    });

  } catch (error) {
    console.error("Set low stock threshold error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set low stock threshold"
    });
  }
};