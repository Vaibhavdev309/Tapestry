import PriceRequest from "../models/PriceRequest.js";

// Create new price request
export const createPriceRequest = async (req, res) => {
  console.log("i am in createPriceRequest");
  try {
    const { items } = req.body;

    const priceRequest = new PriceRequest({
      userId: req.body.userId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size, // Add size to the schema
      })),
    });

    await priceRequest.save();

    const populatedRequest = await PriceRequest.findById(priceRequest._id)
      .populate("items.productId")
      .populate("userId", "name email");

    res.status(201).json({
      success: true,
      message: "Price request created successfully",
      priceRequest: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user's latest price request
export const getCurrentRequest = async (req, res) => {
  console.log("i am in getCurrentRequest");
  try {
    const priceRequest = await PriceRequest.findOne({
      userId: req.body.userId,
      status: { $in: ["pending", "approved", "rejected"] },
    })
      .sort({ createdAt: -1 })
      .populate("items.productId")
      .populate("userId", "name email");
    if (!priceRequest) {
      return res.status(404).json({
        success: false,
        message: "No price request found",
      });
    }

    res.json({
      success: true,
      priceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching price request",
      error: error.message,
    });
  }
};

export const getRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const priceRequest = await PriceRequest.findById(id)
      .populate("items.productId")
      .populate("userId", "name email");

    if (!priceRequest) {
      return res.status(404).json({
        success: false,
        message: "Price request not found",
      });
    }

    res.json({
      success: true,
      priceRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching price request",
      error: error.message,
    });
  }
};

export const getUserRequests = async (req, res) => {
  try {
    const requests = await PriceRequest.find({
      userId: req.body.userId,
      status: { $ne: "completed" }, // Exclude completed requests
    })
      .sort({ createdAt: -1 })
      .populate("items.productId")
      .populate("userId", "name email");

    res.json({ success: true, priceRequests: requests });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching price requests",
      error: error.message,
    });
  }
};

// Get all pending requests (admin)
export const deleteRequest = async (req, res) => {
  try {
    const request = await PriceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    console.log(request.userId.toString(), req.body.userId);
    if (request.userId.toString() !== req.body.userId && !req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this request",
      });
    }

    await PriceRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAdminRequests = async (req, res) => {
  console.log("i cam here");
  try {
    const priceRequests = await PriceRequest.find({ status: "pending" })
      .populate("userId", "name email")
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      priceRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching price requests",
      error: error.message,
    });
  }
};

// Approve request with prices
export const approveRequest = async (req, res) => {
  console.log(" ia masdf");
  try {
    const { id } = req.params;
    const { prices } = req.body;

    if (!prices || Object.keys(prices).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide prices for all items",
      });
    }

    const priceRequest = await PriceRequest.findById(id);

    if (!priceRequest) {
      return res.status(404).json({
        success: false,
        message: "Price request not found",
      });
    }

    if (priceRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    // Update prices for each item
    priceRequest.items = priceRequest.items.map((item) => ({
      ...item.toObject(),
      price: prices[item.productId.toString()],
    }));

    // Calculate total amount
    priceRequest.totalAmount = priceRequest.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    priceRequest.status = "approved";
    await priceRequest.save();

    const populatedRequest = await PriceRequest.findById(id)
      .populate("items.productId")
      .populate("userId", "name email");

    res.json({
      success: true,
      message: "Price request approved successfully",
      priceRequest: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving price request",
      error: error.message,
    });
  }
};

// Reject price request
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const priceRequest = await PriceRequest.findById(id);

    if (!priceRequest) {
      return res.status(404).json({
        success: false,
        message: "Price request not found",
      });
    }

    if (priceRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    priceRequest.status = "rejected";
    priceRequest.rejectionReason = reason;
    await priceRequest.save();

    const populatedRequest = await PriceRequest.findById(id)
      .populate("items.productId")
      .populate("userId", "name email");

    res.json({
      success: true,
      message: "Price request rejected successfully",
      priceRequest: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting price request",
      error: error.message,
    });
  }
};
