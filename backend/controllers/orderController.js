import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import PriceRequest from "../models/PriceRequest.js";

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };
    const newOrder = new orderModel(orderData);
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    await PriceRequest.findByIdAndUpdate(
      req.body.priceRequest,
      { status: "completed" },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

const userOrders = async (req, res) => {
  try {
    console.log("i ma er");
    console.log(req.body.userId);
    const orders = await orderModel
      .find({ userId: req.body.userId })
      .populate({
        path: "items.productId",
        select: "name image",
      })
      .sort({ createdAt: -1 });
    console.log(orders);
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export { placeOrder, allOrders, userOrders, updateStatus };
