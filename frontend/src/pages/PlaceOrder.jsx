import React, { useContext, useEffect, useState } from "react";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [priceRequest, setPriceRequest] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { priceRequestId } = useParams();
  const { navigate, token, backendUrl, currency } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  useEffect(() => {
    const fetchPriceRequest = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/price-requests/user/${priceRequestId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          if (response.data.priceRequest.status !== "approved") {
            toast.error("This price request is not approved");
            navigate("/cart");
          }
          setPriceRequest(response.data.priceRequest);
        }
      } catch (error) {
        toast.error("Error fetching price request");
        navigate("/cart");
      }
    };

    const fetchRazorpayKey = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/payment/razorpay-key`);
        if (response.data.success) {
          setRazorpayKey(response.data.key);
        }
      } catch (error) {
        console.error("Failed to fetch Razorpay key:", error);
      }
    };

    if (priceRequestId) {
      fetchPriceRequest();
      fetchRazorpayKey();
    }
  }, [priceRequestId, token, backendUrl, navigate]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const displayRazorpay = async (orderData) => {
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error("Razorpay SDK failed to load");
      return;
    }

    const options = {
      key: razorpayKey,
      amount: orderData.amount * 100, // Convert to paise
      currency: "INR",
      name: "Tapestry Store",
      description: "Order Payment",
      order_id: orderData.razorpayOrderId,
      handler: async function (response) {
        try {
          setIsProcessing(true);
          const verifyResponse = await axios.post(
            `${backendUrl}/api/payment/verify`,
            {
              orderId: orderData.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (verifyResponse.data.success) {
            toast.success("Payment successful! Order placed.");
            navigate("/orders");
          } else {
            toast.error("Payment verification failed");
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error("Payment verification failed");
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipcode}`,
      },
      theme: {
        color: "#3B82F6",
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (isProcessing) return;

    try {
      if (!priceRequest) return;

      const orderData = {
        address: formData,
        items: priceRequest.items.map((item) => ({
          productId: item.productId._id,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        })),
        amount: priceRequest.totalAmount,
        priceRequest: priceRequestId,
      };

      if (method === "cod") {
        // Cash on Delivery
        const response = await axios.post(
          `${backendUrl}/api/order/placeorder`,
          { ...orderData, paymentMethod: "cod" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success(response.data.message);
          navigate("/orders");
        } else {
          toast.error(response.data.message);
        }
      } else if (method === "razorpay") {
        // Razorpay Payment
        setIsProcessing(true);
        
        const response = await axios.post(
          `${backendUrl}/api/payment/create-order`,
          orderData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          await displayRazorpay({
            orderId: response.data.order.id,
            amount: response.data.amount,
            razorpayOrderId: response.data.razorpayOrderId,
          });
        } else {
          toast.error(response.data.message);
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Order placement failed");
      setIsProcessing(false);
    }
  };

  const onChangeHandler = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!priceRequest) return <div className="p-8 text-center">Loading...</div>;

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-4 sm:pt-14 min-h-[80vh] border-t"
    >
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">First Name</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Last Name</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Email</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Phone</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Street Address</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="street"
            value={formData.street}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">City</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="city"
            value={formData.city}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">State</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">ZIP Code</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="zipcode"
            value={formData.zipcode}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Country</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            type="text"
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg">
            <input
              type="radio"
              id="cod"
              name="paymentMethod"
              value="cod"
              checked={method === "cod"}
              onChange={(e) => setMethod(e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="cod" className="flex items-center gap-3 cursor-pointer">
              <img src={assets.parcel_icon} alt="COD" className="w-8 h-8" />
              <div>
                <div className="font-medium">Cash on Delivery</div>
                <div className="text-sm text-gray-600">Pay when your order is delivered</div>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg">
            <input
              type="radio"
              id="razorpay"
              name="paymentMethod"
              value="razorpay"
              checked={method === "razorpay"}
              onChange={(e) => setMethod(e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="razorpay" className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div>
                <div className="font-medium">Online Payment</div>
                <div className="text-sm text-gray-600">Pay securely with Razorpay</div>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <CartTotal
            cartItems={priceRequest.items}
            totalAmount={priceRequest.totalAmount}
            currency={currency}
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isProcessing ? "Processing..." : `Place Order - ${currency}${priceRequest.totalAmount}`}
        </button>

        {method === "razorpay" && (
          <div className="text-xs text-gray-500 text-center">
            Secure payment powered by Razorpay
          </div>
        )}
      </div>
    </form>
  );
};

export default PlaceOrder;