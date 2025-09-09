import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import PriceRequest from "../models/PriceRequest.js";
import productModel from "../models/productModel.js";
import emailService from "../services/emailService.js";

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, paymentMethod = "cod", priceRequestId } = req.body;

    // Validate required fields
    if (!userId || !items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Check stock availability for all items
    const stockChecks = [];
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const stockInfo = product.checkStock(item.size, item.quantity);
      if (stockInfo.available < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.size}). Available: ${stockInfo.available}, Requested: ${item.quantity}`
        });
      }

      stockChecks.push({
        product,
        item,
        stockInfo
      });
    }

    // Generate order number
    const generateOrderNumber = () => {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `ORD-${timestamp.slice(-6)}-${random}`;
    };

    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      status: "pending",
      orderNumber: generateOrderNumber(),
      priceRequest: priceRequestId || null,
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Reserve stock for all items
    for (const { product, item } of stockChecks) {
      try {
        await product.updateStock(
          item.size,
          item.quantity,
          'reserved',
          `Order ${newOrder.orderNumber}`,
          newOrder._id,
          userId
        );
      } catch (error) {
        console.error(`Failed to reserve stock for ${product.name}:`, error);
        // If stock reservation fails, we should ideally cancel the order
        // For now, we'll log the error and continue
      }
    }

    // Clear user cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Update price request status if exists
    if (priceRequestId) {
      await PriceRequest.findByIdAndUpdate(
        priceRequestId,
        { status: "completed" },
        { new: true }
      );
    }

    // Send order confirmation email (async, don't wait for it)
    emailService.sendOrderConfirmationEmail(newOrder._id).catch(error => {
      console.error("Failed to send order confirmation email:", error);
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        amount: newOrder.amount,
        paymentMethod: newOrder.paymentMethod,
        status: newOrder.status,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to place order" 
    });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      orders,
      count: orders.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch orders" 
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    const orders = await orderModel
      .find({ userId })
      .populate({
        path: "items.productId",
        select: "name image price",
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders"
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required"
      });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }
    
    const order = await orderModel.findByIdAndUpdate(
      orderId, 
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Handle stock updates based on status change
    if (status === 'processing' && order.paymentStatus === 'paid') {
      // Move reserved stock to actual stock deduction
      for (const item of order.items) {
        try {
          const product = await productModel.findById(item.productId);
          if (product) {
            // Release reserved stock and deduct actual stock
            await product.updateStock(
              item.size,
              item.quantity,
              'released',
              `Order ${order.orderNumber} processing`,
              orderId,
              order.userId
            );
            await product.updateStock(
              item.size,
              item.quantity,
              'out',
              `Order ${order.orderNumber} shipped`,
              orderId,
              order.userId
            );
          }
        } catch (error) {
          console.error(`Failed to update stock for order ${order.orderNumber}:`, error);
        }
      }
    } else if (status === 'cancelled') {
      // Release reserved stock if order is cancelled
      for (const item of order.items) {
        try {
          const product = await productModel.findById(item.productId);
          if (product) {
            await product.updateStock(
              item.size,
              item.quantity,
              'released',
              `Order ${order.orderNumber} cancelled`,
              orderId,
              order.userId
            );
          }
        } catch (error) {
          console.error(`Failed to release stock for cancelled order ${order.orderNumber}:`, error);
        }
      }
    }

    // Send order status update email (async, don't wait for it)
    emailService.sendOrderStatusUpdateEmail(orderId, 'previous').catch(error => {
      console.error("Failed to send order status update email:", error);
    });
    
    res.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: {
        id: order._id,
        status: order.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order status" 
    });
  }
};

export { placeOrder, allOrders, userOrders, updateStatus };
