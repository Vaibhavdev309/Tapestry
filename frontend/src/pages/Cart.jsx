import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";

const Cart = () => {
  const { products, cartItems, navigate, currency, updateQuantity } =
    useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

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

  return (
    <div className="max-w-7xl mx-auto pt-8 sm:pt-14 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-12">
        <Title text1="Your Shopping" text2="Cart" />
        <p className="text-gray-500 mt-2 text-sm">
          {cartData.length} items in your cart
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border divide-y divide-gray-100">
        {cartData.map((item) => {
          const productData = products.find(
            (product) => product._id === item._id
          );
          const totalPrice = (productData.price * item.quantity).toFixed(2);

          return (
            <div
              key={`${item._id}-${item.size}`}
              className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Product Image */}
                <div className="w-full sm:w-32 flex-shrink-0">
                  <img
                    src={productData.image[0]}
                    alt={productData.name}
                    className="w-full h-32 object-cover rounded-lg shadow-sm"
                  />
                </div>

                {/* Product Details */}
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

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {currency}
                        {totalPrice}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currency}
                        {productData.price} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
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

                    {/* Delete Button */}
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

      {/* Checkout Section */}
      <div className="mt-8 sm:mt-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <CartTotal />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            <div className="bg-black p-6 rounded-lg shadow-lg">
              <h3 className="text-white text-lg font-semibold mb-4">
                Ready to Checkout?
              </h3>
              <button
                onClick={() => navigate("/place-order")}
                className="w-full bg-white text-black py-3.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Proceed to Secure Checkout
              </button>
              <p className="text-white text-sm mt-4 text-center">
                <span className="opacity-75">Need help?</span>{" "}
                <a href="/contact" className="underline hover:no-underline">
                  Contact Support
                </a>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">Shopping Benefits:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Free 7-day returns
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Secure payment options
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Price match guarantee
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
