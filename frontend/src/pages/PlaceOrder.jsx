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
          { headers: { token } }
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

    if (priceRequestId) fetchPriceRequest();
  }, [priceRequestId, token, backendUrl, navigate]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
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

      const response = await axios.post(
        `${backendUrl}/api/order/placeorder`,
        orderData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/orders");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Order placement failed");
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

        <div className="flex gap-3">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            value={formData.firstName}
            onChange={onChangeHandler}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            value={formData.lastName}
            onChange={onChangeHandler}
            required
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          value={formData.email}
          onChange={onChangeHandler}
          required
        />

        <input
          type="text"
          name="street"
          placeholder="Street Address"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          value={formData.street}
          onChange={onChangeHandler}
          required
        />

        <div className="flex gap-3">
          <input
            type="text"
            name="city"
            placeholder="City"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            value={formData.city}
            onChange={onChangeHandler}
            required
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            value={formData.state}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            name="zipcode"
            placeholder="Zipcode"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            value={formData.zipcode}
            onChange={onChangeHandler}
            required
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            value={formData.country}
            onChange={onChangeHandler}
            required
          />
        </div>

        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          value={formData.phone}
          onChange={onChangeHandler}
          required
        />
      </div>

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal
            total={priceRequest.totalAmount}
            items={priceRequest.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            }))}
          />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />

          <div className="flex gap-3 flex-col lg:flex-row">
            <div
              onClick={() => setMethod("stripe")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <div
                className={`w-3.5 h-3.5 border rounded-full ${
                  method === "stripe" ? "bg-green-400" : "bg-transparent"
                }`}
              />
              <img src={assets.stripe_logo} className="h-5 mx-4" alt="Stripe" />
            </div>

            <div
              onClick={() => setMethod("razorpay")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <div
                className={`w-3.5 h-3.5 border rounded-full ${
                  method === "razorpay" ? "bg-green-400" : "bg-transparent"
                }`}
              />
              <img
                src={assets.razorpay_logo}
                className="h-5 mx-4"
                alt="Razorpay"
              />
            </div>

            <div
              onClick={() => setMethod("cod")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <div
                className={`w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-400" : "bg-transparent"
                }`}
              />
              <span>CASH ON DELIVERY</span>
            </div>
          </div>

          <div className="w-full text-end mt-8">
            <button
              type="submit"
              className="bg-black text-white px-16 py-3 text-sm hover:bg-gray-800 transition-colors"
            >
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
