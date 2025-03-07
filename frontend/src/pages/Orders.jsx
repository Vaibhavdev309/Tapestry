import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";

const Orders = () => {
  const { currency, backendUrl, token } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      if (!token) return;
      const response = await axios.get(`${backendUrl}/api/order/userorders`, {
        headers: { token },
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadOrders();
  }, [token, backendUrl]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-500";
      case "shipped":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Title text1="Order" text2="History" />
        <div className="text-center py-8">
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Title text1="Order" text2="History" />

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">
                    Order ID: {order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  />
                  <span className="text-sm capitalize">{order.status}</span>
                </div>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={`${order._id}-${item.productId}`}
                    className="flex gap-4 border-t pt-4"
                  >
                    <img
                      src={
                        item.productId?.image?.[0] || assets.placeholder_image
                      }
                      alt={item.productId?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = assets.placeholder_image;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {item.productId?.name || "Product"}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Size: {item.size}</p>
                        <p>Quantity: {item.quantity}</p>
                        <p>
                          Price: {currency}
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-medium">Total Amount:</p>
                    <p className="text-gray-600">
                      {currency}
                      {order.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Payment Method:</p>
                    <p className="text-gray-600 capitalize">
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
