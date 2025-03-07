import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const Request = ({ token }) => {
  const [priceRequests, setPriceRequests] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetchPriceRequests();
    console.log("success");
  }, []);

  const fetchPriceRequests = async () => {
    try {
      console.log("i am heddre");
      const response = await axios.get(
        `${backendUrl}/api/price-requests/admin`,
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        setPriceRequests(response.data.priceRequests);
      }
    } catch (error) {
      console.log(error.message);
      console.error("Error fetching price requests:", error);
    }
  };

  const handlePriceChange = (requestId, productId, price) => {
    setPrices((prev) => ({
      ...prev,
      [`${requestId}-${productId}`]: parseFloat(price) || 0,
    }));
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const requestPrices = Object.entries(prices)
        .filter(([key]) => key.startsWith(requestId))
        .reduce((acc, [key, value]) => {
          const productId = key.split("-")[1];
          acc[productId] = value;
          return acc;
        }, {});

      const response = await axios.post(
        `${backendUrl}/api/price-requests/${action}/${requestId}`,
        { prices: requestPrices },
        { headers: { token } }
      );

      if (response.data.success) {
        fetchPriceRequests();
      }
    } catch (error) {
      console.error(`Error ${action}ing price request:`, error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Price Requests</h2>

      <div className="space-y-6">
        {priceRequests.map((request) => (
          <div key={request._id} className="bg-white p-4 rounded-lg shadow">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                Request from {request.userId.name}
              </h3>
              <p className="text-sm text-gray-500">
                Created at: {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-4">
              {request.items.map((item) => (
                <div
                  key={item.productId._id}
                  className="flex items-center space-x-4"
                >
                  <img
                    src={item.productId.image}
                    alt={item.productId.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productId.name}</h4>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Price"
                      value={
                        prices[`${request._id}-${item.productId._id}`] || ""
                      }
                      onChange={(e) =>
                        handlePriceChange(
                          request._id,
                          item.productId._id,
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border rounded text-right"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-4 mt-4">
                <button
                  onClick={() => handleRequestAction(request._id, "reject")}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleRequestAction(request._id, "approve")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Approve with Prices
                </button>
              </div>
            </div>
          </div>
        ))}

        {priceRequests.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No pending price requests
          </p>
        )}
      </div>
    </div>
  );
};

export default Request;
