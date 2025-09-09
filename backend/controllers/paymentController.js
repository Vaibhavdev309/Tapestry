import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import PriceRequest from "../models/PriceRequest.js";
import { createOrder, verifySignature, fetchPayment, refundPayment } from "../config/razorpay.js";
import crypto from "crypto";

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

// Create Razorpay order for payment
export const createRazorpayOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, priceRequestId } = req.body;

    // Validate required fields
    if (!userId || !items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    // Create Razorpay order
    const razorpayOrder = await createOrder(amount, "INR");
    
    if (!razorpayOrder.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order",
        error: razorpayOrder.error
      });
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order in database with pending payment
    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      status: "pending",
      orderNumber,
      paymentDetails: {
        razorpayOrderId: razorpayOrder.order.id,
      },
      priceRequest: priceRequestId || null,
    };

    const order = new orderModel(orderData);
    await order.save();

    res.json({
      success: true,
      message: "Payment order created successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        razorpayOrderId: razorpayOrder.order.id,
      },
      razorpayOrder: razorpayOrder.order,
    });

  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      orderId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Validate required fields
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data"
      });
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify signature
    const isSignatureValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPayment(razorpay_payment_id);
    
    if (!paymentDetails.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment details"
      });
    }

    // Update order with payment details
    order.paymentStatus = "paid";
    order.status = "processing";
    order.paymentDetails = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId: razorpay_payment_id,
      gatewayResponse: paymentDetails.payment,
    };

    await order.save();

    // Clear user cart
    await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

    // Update price request status if exists
    if (order.priceRequest) {
      await PriceRequest.findByIdAndUpdate(
        order.priceRequest,
        { status: "completed" },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId)
      .populate('userId', 'name email')
      .populate('items.productId', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        paymentStatus: order.paymentStatus,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.items,
        address: order.address,
      },
    });

  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Process refund
export const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is not paid, cannot process refund"
      });
    }

    if (order.paymentMethod !== "razorpay") {
      return res.status(400).json({
        success: false,
        message: "Refund only available for Razorpay payments"
      });
    }

    // Process refund with Razorpay
    const refundResult = await refundPayment(
      order.paymentDetails.razorpayPaymentId,
      amount || order.amount
    );

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to process refund",
        error: refundResult.error
      });
    }

    // Update order status
    order.paymentStatus = "refunded";
    order.status = "cancelled";
    order.notes = reason || "Refund processed";
    await order.save();

    res.json({
      success: true,
      message: "Refund processed successfully",
      refund: refundResult.refund,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
    });

  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get Razorpay key for frontend
export const getRazorpayKey = async (req, res) => {
  try {
    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get Razorpay key"
    });
  }
};

// Webhook handler for Razorpay events
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature"
      });
    }

    const event = req.body;

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'refund.created':
        await handleRefundCreated(event.payload.refund.entity);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed"
    });
  }
};

// Handle payment captured webhook
const handlePaymentCaptured = async (payment) => {
  try {
    const order = await orderModel.findOne({
      'paymentDetails.razorpayPaymentId': payment.id
    });

    if (order && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
      order.status = 'processing';
      await order.save();
    }
  } catch (error) {
    console.error("Handle payment captured error:", error);
  }
};

// Handle payment failed webhook
const handlePaymentFailed = async (payment) => {
  try {
    const order = await orderModel.findOne({
      'paymentDetails.razorpayPaymentId': payment.id
    });

    if (order) {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();
    }
  } catch (error) {
    console.error("Handle payment failed error:", error);
  }
};

// Handle refund created webhook
const handleRefundCreated = async (refund) => {
  try {
    const order = await orderModel.findOne({
      'paymentDetails.razorpayPaymentId': refund.payment_id
    });

    if (order) {
      order.paymentStatus = 'refunded';
      order.status = 'cancelled';
      await order.save();
    }
  } catch (error) {
    console.error("Handle refund created error:", error);
  }
};