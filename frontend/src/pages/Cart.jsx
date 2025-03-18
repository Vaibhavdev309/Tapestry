import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import axios from "axios";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    products,
    cartItems,
    navigate,
    currency,
    updateQuantity,
    token,
    backendUrl,
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [priceRequests, setPriceRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);

  useEffect(() => {
    const tempData = [];
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          tempData.push({
            _id: items,
            size: item,
            quantity: cartItems[items][item],
          });
        }
      }
    }
    setCartData(tempData);
  }, [cartItems]);

  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/price-requests/user`,
          { headers: { token } }
        );
        if (response.data.success) {
          const filteredRequests = response.data.priceRequests.filter(
            (req) => req.status !== "completed"
          );
          setPriceRequests(filteredRequests);
        }
      } catch (error) {
        console.error("Error fetching price requests:", error);
      }
    };

    if (token) fetchUserRequests();
  }, [token, backendUrl]);

  const handleRequestToAdmin = async () => {
    const items = cartData.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
      size: item.size,
    }));

    try {
      const response = await axios.post(
        `${backendUrl}/api/price-requests/create`,
        { items },
        { headers: { token } }
      );

      if (response.data.success) {
        setPriceRequests([response.data.priceRequest, ...priceRequests]);
        toast.success("Price request submitted to admin");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting request");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this request?"
      );
      if (!confirmDelete) return;

      const response = await axios.delete(
        `${backendUrl}/api/price-requests/${requestId}`,
        { headers: { token } }
      );

      if (response.data.success) {
        setPriceRequests((prev) => prev.filter((req) => req._id !== requestId));
        if (activeRequest === requestId) setActiveRequest(null);
        toast.success("Request deleted successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting request");
    }
  };

  const handleResubmitRequest = async (requestId) => {
    try {
      const originalRequest = priceRequests.find(
        (req) => req._id === requestId
      );
      if (!originalRequest) return;

      const response = await axios.post(
        `${backendUrl}/api/price-requests/create`,
        { items: originalRequest.items },
        { headers: { token } }
      );

      if (response.data.success) {
        setPriceRequests([response.data.priceRequest, ...priceRequests]);
        toast.success("Request resubmitted successfully");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error resubmitting request"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-8 sm:pt-14 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-12">
        <Title text1="Your Shopping" text2="Cart" />
        <p className="text-gray-500 mt-2 text-sm">
          {cartData.length} items in your cart
        </p>
      </div>

      {/* Price Requests List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Price Requests</h2>
        <div className="space-y-4">
          {priceRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-lg p-4 shadow-sm border"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    Request #{request._id.slice(-6)} -{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p
                    className={`text-sm ${
                      request.status === "approved"
                        ? "text-green-600"
                        : request.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    Status: {request.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {request.status === "rejected" && (
                    <button
                      onClick={() => handleResubmitRequest(request._id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Resubmit request"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRequest(request._id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete request"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setActiveRequest(
                        activeRequest === request._id ? null : request._id
                      )
                    }
                    className="text-black hover:text-gray-600"
                  >
                    {activeRequest === request._id ? "▼" : "▶"}
                  </button>
                </div>
              </div>

              {activeRequest === request._id && (
                <div className="mt-4">
                  {request.items.map((item) => (
                    <div
                      key={`${item.productId._id}-${item.size}`}
                      className="flex justify-between py-2 border-t"
                    >
                      <div>
                        <p>{item.productId.name}</p>
                        <p className="text-sm text-gray-500">
                          Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div>
                        {request.status === "approved" ? (
                          <p>
                            {currency}
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                        ) : request.status === "rejected" ? (
                          <p className="text-red-500">
                            {request.rejectionReason}
                          </p>
                        ) : (
                          <p>Pending approval</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {request.status === "approved" && (
                    <div className="mt-4 flex justify-between items-center">
                      <CartTotal total={request.totalAmount} />
                      <button
                        onClick={() => navigate(`/place-order/${request._id}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Cart Items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Cart Items</h2>
        <div className="bg-white rounded-xl shadow-sm border divide-y divide-gray-100">
          {cartData.map((item) => {
            const productData = products.find(
              (product) => product._id === item._id
            );

            return (
              <div
                key={`${item._id}-${item.size}`}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className="w-full sm:w-32 flex-shrink-0">
                    <img
                      src={productData.image[0]}
                      alt={productData.name}
                      className="w-full h-32 object-cover rounded-lg shadow-sm"
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {productData.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-full">
                            Size: {item.size}
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 rounded-full">
                            Color: {productData.color || "Black"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Material: {productData.material || "Pure Silk"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-gray-500">Price pending approval</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">
                          Quantity:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                item.size,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            −
                          </button>
                          <input
                            value={item.quantity}
                            onChange={(e) => {
                              const newValue = Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              );
                              updateQuantity(item._id, item.size, newValue);
                            }}
                            type="number"
                            min={1}
                            className="w-16 px-2 py-1.5 border rounded-md text-center focus:ring-2 focus:ring-black focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => updateQuantity(item._id, item.size, 0)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-2 transition-colors"
                      >
                        <img
                          className="w-4"
                          src={assets.bin_icon}
                          alt="Delete item"
                        />
                        <span className="text-sm font-medium">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Request Submission */}
      {cartData.length > 0 && (
        <div className="bg-black p-6 rounded-lg shadow-lg mt-8">
          <h3 className="text-white text-lg font-semibold mb-4">
            Submit New Price Request
          </h3>
          <button
            onClick={handleRequestToAdmin}
            className="w-full bg-white text-black py-3.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Request Price Approval for Current Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
