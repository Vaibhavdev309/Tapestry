import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import toastService from "../utils/toastService";

const ReviewForm = ({ productId, productName, onReviewSubmitted }) => {
  const { token, user } = useContext(ShopContext);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    comment: "",
    size: "",
    orderId: ""
  });

  useEffect(() => {
    if (token && showForm) {
      fetchUserOrders();
    }
  }, [token, showForm]);

  const fetchUserOrders = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/api/order/user-orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Filter orders that contain this product and are delivered/processed
        const relevantOrders = response.data.orders.filter(order => 
          order.status === 'delivered' || order.status === 'processing' || order.status === 'shipped'
        );
        setUserOrders(relevantOrders);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toastService.showWarning("Please login to write a review");
      return;
    }

    if (formData.rating === 0) {
      toastService.showValidationError("Please select a rating");
      return;
    }

    if (!formData.title.trim() || !formData.comment.trim() || !formData.size) {
      toastService.showValidationError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const reviewData = {
        productId,
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        size: formData.size,
        ...(formData.orderId && { orderId: formData.orderId })
      };

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/api/reviews`,
        reviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toastService.showSuccess("Review submitted successfully! It will be reviewed before being published.");
        setFormData({
          rating: 0,
          title: "",
          comment: "",
          size: "",
          orderId: ""
        });
        setShowForm(false);
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toastService.showError(error.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-2xl ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        } ${interactive ? "cursor-pointer hover:text-yellow-500" : ""}`}
        onClick={interactive ? () => handleRatingClick(index + 1) : undefined}
      >
        ★
      </span>
    ));
  };

  if (!token) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Write a Review</h3>
        <p className="text-gray-600 mb-4">Please login to write a review for this product.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <p className="text-gray-600 mb-4">
          Share your experience with {productName} to help other customers make informed decisions.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review for {productName}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {renderStars(formData.rating, true)}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating > 0 && (
                formData.rating === 1 ? "Poor" :
                formData.rating === 2 ? "Fair" :
                formData.rating === 3 ? "Good" :
                formData.rating === 4 ? "Very Good" :
                "Excellent"
              )}
            </span>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size *
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select Size</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="Extra Large">Extra Large</option>
          </select>
        </div>

        {/* Order Selection (Optional) */}
        {userOrders.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order (Optional - for verified purchase badge)
            </label>
            <select
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Order (Optional)</option>
              {userOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  Order #{order.orderNumber} - {new Date(order.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecting an order will mark your review as a verified purchase
            </p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Summarize your experience in a few words"
            maxLength={100}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={4}
            placeholder="Tell us about your experience with this product. What did you like or dislike? How does it compare to your expectations?"
            maxLength={1000}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.comment.length}/1000 characters
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-sm mb-2">Review Guidelines:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Be honest and specific about your experience</li>
            <li>• Focus on the product itself, not shipping or customer service</li>
            <li>• Avoid personal information or inappropriate content</li>
            <li>• Reviews are moderated and may take 24-48 hours to appear</li>
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;