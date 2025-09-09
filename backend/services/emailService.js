import { sendEmail, sendSimpleEmail } from "../config/email.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Email templates and data preparation
const prepareOrderData = (order, user) => {
  return {
    name: user.name,
    email: user.email,
    orderNumber: order.orderNumber,
    amount: order.amount,
    status: order.status,
    items: order.items,
    address: order.address,
    trackOrderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders`,
    websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    paymentMethod: order.paymentMethod,
    createdAt: new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

const preparePaymentData = (order, user, paymentDetails) => {
  return {
    name: user.name,
    email: user.email,
    orderNumber: order.orderNumber,
    amount: order.amount,
    transactionId: paymentDetails.razorpayPaymentId || paymentDetails.transactionId,
    paymentMethod: order.paymentMethod,
    paymentDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    trackOrderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders`,
    websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  };
};

const prepareStatusUpdateData = (order, user, oldStatus) => {
  return {
    name: user.name,
    email: user.email,
    orderNumber: order.orderNumber,
    status: order.status,
    oldStatus: oldStatus,
    updateDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN') : null,
    trackingUrl: order.trackingNumber ? `https://www.tracking.com/track/${order.trackingNumber}` : null,
    trackOrderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders`,
    websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  };
};

// Email notification functions
export const sendWelcomeEmail = async (user) => {
  try {
    const data = {
      name: user.name,
      email: user.email,
      websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    const result = await sendEmail(
      user.email,
      "Welcome to Tapestry Store! 🎉",
      "welcome",
      data
    );

    if (result.success) {
      console.log(`Welcome email sent to ${user.email}`);
    } else {
      console.error(`Failed to send welcome email to ${user.email}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

export const sendOrderConfirmationEmail = async (orderId) => {
  try {
    const order = await orderModel.findById(orderId).populate('userId');
    if (!order) {
      throw new Error("Order not found");
    }

    const data = prepareOrderData(order, order.userId);
    
    const result = await sendEmail(
      order.userId.email,
      `Order Confirmation - ${order.orderNumber}`,
      "order-confirmation",
      data
    );

    if (result.success) {
      console.log(`Order confirmation email sent to ${order.userId.email} for order ${order.orderNumber}`);
    } else {
      console.error(`Failed to send order confirmation email:`, result.error);
    }

    return result;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return { success: false, error: error.message };
  }
};

export const sendPaymentConfirmationEmail = async (orderId, paymentDetails) => {
  try {
    const order = await orderModel.findById(orderId).populate('userId');
    if (!order) {
      throw new Error("Order not found");
    }

    const data = preparePaymentData(order, order.userId, paymentDetails);
    
    const result = await sendEmail(
      order.userId.email,
      `Payment Confirmation - ${order.orderNumber}`,
      "payment-confirmation",
      data
    );

    if (result.success) {
      console.log(`Payment confirmation email sent to ${order.userId.email} for order ${order.orderNumber}`);
    } else {
      console.error(`Failed to send payment confirmation email:`, result.error);
    }

    return result;
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    return { success: false, error: error.message };
  }
};

export const sendOrderStatusUpdateEmail = async (orderId, oldStatus) => {
  try {
    const order = await orderModel.findById(orderId).populate('userId');
    if (!order) {
      throw new Error("Order not found");
    }

    const data = prepareStatusUpdateData(order, order.userId, oldStatus);
    
    const result = await sendEmail(
      order.userId.email,
      `Order Status Update - ${order.orderNumber}`,
      "order-status-update",
      data
    );

    if (result.success) {
      console.log(`Order status update email sent to ${order.userId.email} for order ${order.orderNumber}`);
    } else {
      console.error(`Failed to send order status update email:`, result.error);
    }

    return result;
  } catch (error) {
    console.error("Error sending order status update email:", error);
    return { success: false, error: error.message };
  }
};

export const sendPriceRequestNotificationEmail = async (priceRequestId) => {
  try {
    const PriceRequest = (await import("../models/PriceRequest.js")).default;
    const priceRequest = await PriceRequest.findById(priceRequestId).populate('userId');
    
    if (!priceRequest) {
      throw new Error("Price request not found");
    }

    const data = {
      name: priceRequest.userId.name,
      email: priceRequest.userId.email,
      requestId: priceRequest._id,
      items: priceRequest.items,
      totalAmount: priceRequest.totalAmount,
      status: priceRequest.status,
      websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    const result = await sendEmail(
      priceRequest.userId.email,
      `Price Request ${priceRequest.status} - Request #${priceRequest._id}`,
      "price-request-notification",
      data
    );

    if (result.success) {
      console.log(`Price request notification email sent to ${priceRequest.userId.email}`);
    } else {
      console.error(`Failed to send price request notification email:`, result.error);
    }

    return result;
  } catch (error) {
    console.error("Error sending price request notification email:", error);
    return { success: false, error: error.message };
  }
};

export const sendAdminNotificationEmail = async (subject, message, orderId = null) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("Admin email not configured");
    }

    const data = {
      subject,
      message,
      orderId,
      timestamp: new Date().toLocaleString('en-IN'),
      websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    const result = await sendSimpleEmail(
      adminEmail,
      `Admin Notification: ${subject}`,
      `Subject: ${subject}\n\nMessage: ${message}\n\nOrder ID: ${orderId || 'N/A'}\n\nTimestamp: ${data.timestamp}\n\nWebsite: ${data.websiteUrl}`
    );

    if (result.success) {
      console.log(`Admin notification email sent to ${adminEmail}`);
    } else {
      console.error(`Failed to send admin notification email:`, result.error);
    }

    return result;
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return { success: false, error: error.message };
  }
};

// Bulk email functions
export const sendBulkOrderUpdateEmails = async (orderIds, status) => {
  try {
    const results = [];
    
    for (const orderId of orderIds) {
      const result = await sendOrderStatusUpdateEmail(orderId, 'previous');
      results.push({ orderId, result });
    }

    console.log(`Bulk order update emails sent for ${orderIds.length} orders`);
    return { success: true, results };
  } catch (error) {
    console.error("Error sending bulk order update emails:", error);
    return { success: false, error: error.message };
  }
};

// Email preferences and unsubscribe
export const updateEmailPreferences = async (userId, preferences) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { emailPreferences: preferences },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    console.log(`Email preferences updated for user ${userId}`);
    return { success: true, user };
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPriceRequestNotificationEmail,
  sendAdminNotificationEmail,
  sendBulkOrderUpdateEmails,
  updateEmailPreferences
};