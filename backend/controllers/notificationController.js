import emailService from "../services/emailService.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import PriceRequest from "../models/PriceRequest.js";

// Send test email
export const sendTestEmail = async (req, res) => {
  try {
    const { email, template } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required"
      });
    }

    let result;
    
    switch (template) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail({ email, name: 'Test User' });
        break;
      case 'order-confirmation':
        // Create mock data for testing
        const mockOrder = {
          orderNumber: 'TEST-123456',
          amount: 1500,
          status: 'processing',
          items: [
            {
              productId: { name: 'Test Tapestry' },
              size: 'Medium',
              quantity: 1,
              price: 1500
            }
          ],
          address: {
            firstName: 'Test',
            lastName: 'User',
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipcode: '123456',
            country: 'India',
            phone: '9876543210'
          },
          paymentMethod: 'razorpay',
          createdAt: new Date()
        };
        result = await emailService.sendOrderConfirmationEmail(mockOrder);
        break;
      default:
        result = await emailService.sendSimpleEmail(
          email,
          'Test Email from Tapestry Store',
          'This is a test email to verify email configuration.'
        );
    }

    if (result.success) {
      res.json({
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: result.error
      });
    }

  } catch (error) {
    console.error("Send test email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get email preferences
export const getEmailPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select('emailPreferences');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      preferences: user.emailPreferences || {
        orderUpdates: true,
        paymentNotifications: true,
        promotionalEmails: true,
        priceRequestUpdates: true
      }
    });

  } catch (error) {
    console.error("Get email preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update email preferences
export const updateEmailPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Invalid preferences data"
      });
    }

    const result = await emailService.updateEmailPreferences(userId, preferences);

    if (result.success) {
      res.json({
        success: true,
        message: "Email preferences updated successfully",
        preferences: result.user.emailPreferences
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update email preferences",
        error: result.error
      });
    }

  } catch (error) {
    console.error("Update email preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Send manual notification
export const sendManualNotification = async (req, res) => {
  try {
    const { type, orderId, message } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Notification type is required"
      });
    }

    let result;

    switch (type) {
      case 'order-status':
        if (!orderId) {
          return res.status(400).json({
            success: false,
            message: "Order ID is required for order status notifications"
          });
        }
        result = await emailService.sendOrderStatusUpdateEmail(orderId, 'manual');
        break;
      
      case 'admin-notification':
        result = await emailService.sendAdminNotificationEmail(
          'Manual Admin Notification',
          message || 'Manual notification sent from admin panel',
          orderId
        );
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid notification type"
        });
    }

    if (result.success) {
      res.json({
        success: true,
        message: "Notification sent successfully",
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send notification",
        error: result.error
      });
    }

  } catch (error) {
    console.error("Send manual notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get notification history
export const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get user's orders to track notification history
    const orders = await orderModel.find({ userId })
      .select('orderNumber status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await orderModel.countDocuments({ userId });

    // Mock notification history (in a real app, you'd store this in a notifications collection)
    const notifications = orders.map(order => ({
      id: order._id,
      type: 'order-update',
      title: `Order ${order.orderNumber} Status Update`,
      message: `Your order status has been updated to ${order.status}`,
      timestamp: order.updatedAt,
      read: false
    }));

    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error("Get notification history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // In a real app, you'd update the notification in the database
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get email statistics (admin only)
export const getEmailStatistics = async (req, res) => {
  try {
    // Mock statistics (in a real app, you'd query actual email logs)
    const stats = {
      totalEmailsSent: 1250,
      emailsToday: 45,
      emailsThisWeek: 320,
      emailsThisMonth: 1250,
      successRate: 98.5,
      bounceRate: 1.2,
      openRate: 65.8,
      clickRate: 12.3,
      topTemplates: [
        { name: 'Order Confirmation', count: 450 },
        { name: 'Payment Confirmation', count: 380 },
        { name: 'Order Status Update', count: 320 },
        { name: 'Welcome Email', count: 100 }
      ]
    };

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error("Get email statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};