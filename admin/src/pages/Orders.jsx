import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );
      response.data.success
        ? setOrders(response.data.orders)
        : toast.error(response.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (orderId, event) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { token } }
      );
      if (response.data.success) {
        await fetchAllOrders();
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Order Management
      </h2>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            No orders found
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-[60px_2fr_1fr_1fr_120px] gap-4 lg:gap-6 items-start">
                {/* Order Icon */}
                <div className="flex justify-center md:justify-start">
                  <img
                    src={assets.parcel_icon}
                    alt="Order"
                    className="w-10 h-10 object-contain"
                  />
                </div>

                {/* Order Details */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-600">
                        {item.name} × {item.quantity}{" "}
                        {item.size && `(${item.size})`}
                      </p>
                    ))}
                  </div>
                  <div className="pt-2">
                    <p className="font-medium text-gray-800">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.address.street}, {order.address.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.address.state}, {order.address.country} -{" "}
                      {order.address.zipcode}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.address.phone}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""}
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">
                      Method: {order.paymentMethod}
                    </p>
                    <p className="flex items-center gap-1">
                      Payment:
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.payment ? "Completed" : "Pending"}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Date: {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center">
                  <p className="text-lg font-semibold text-gray-800">
                    {currency}
                    {order.amount.toFixed(2)}
                  </p>
                </div>

                {/* Status Selector */}
                <div className="md:col-span-1">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 bg-white"
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Packing">Packing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
