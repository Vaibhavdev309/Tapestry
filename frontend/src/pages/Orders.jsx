import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import Title from "../components/Title";

const Orders = () => {
  const { currency, backendUrl, token } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);

  const loadOrderData = async () => {
    try {
      if (!token) return;
      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        const allOrdersItem = response.data.orders.flatMap((order) =>
          order.items.map((item) => ({
            ...item,
            status: order.status,
            payment: order.payment,
            date: order.date,
            paymentMethod: order.paymentMethod,
            orderId: order._id,
          }))
        );
        setOrderData(allOrdersItem);
      }
    } catch (error) {
      console.error("Error loading order data:", error.message);
    }
  };

  useEffect(() => {
    if (token) loadOrderData();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Title text1="Order" text2="History" />

      {orderData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orderData.slice(0, 3).map((item, index) => (
            <div
              key={`${item.orderId}-${index}`}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="w-full md:w-40 flex-shrink-0">
                  <img
                    src={item.image[0]}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>

                {/* Order Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.name}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Price:</span> {currency}
                        {item.price}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Quantity:</span>{" "}
                        {item.quantity || 1}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Size:</span>{" "}
                        {item.size || "M"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Order Date:</span>{" "}
                        {new Date(item.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Payment Method:</span>{" "}
                        <span className="capitalize">{item.paymentMethod}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        ></div>
                        <span className="text-sm font-medium capitalize">
                          {item.status || "Processing"}
                        </span>
                      </div>
                      <button
                        onClick={loadOrderData}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                      >
                        Track Order
                      </button>
                    </div>
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
