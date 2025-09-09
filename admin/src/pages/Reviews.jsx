import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Reviews = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModerateModal, setShowModerateModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [moderationData, setModerationData] = useState({
    action: "approve",
    reason: ""
  });
  const [responseData, setResponseData] = useState({
    response: ""
  });

  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "statistics") {
        const response = await axios.get(`${backendUrl}/api/reviews/admin/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStatistics(response.data.statistics);
        }
      } else {
        const endpoint = activeTab === "pending" 
          ? "pending" 
          : activeTab === "flagged" 
          ? "flagged" 
          : "all";
        
        const response = await axios.get(`${backendUrl}/api/reviews/admin/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async () => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/reviews/admin/${selectedReview._id}/moderate`,
        moderationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Review ${moderationData.action}d successfully`);
        setShowModerateModal(false);
        setSelectedReview(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error moderating review:", error);
      toast.error("Failed to moderate review");
    }
  };

  const handleAddResponse = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/reviews/admin/${selectedReview._id}/response`,
        responseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Business response added successfully");
        setShowResponseModal(false);
        setSelectedReview(null);
        setResponseData({ response: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding response:", error);
      toast.error("Failed to add business response");
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "flagged":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Management</h1>
        <button
          onClick={fetchData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pending Reviews
        </button>
        <button
          onClick={() => setActiveTab("flagged")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "flagged"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Flagged Reviews
        </button>
        <button
          onClick={() => setActiveTab("statistics")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "statistics"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === "statistics" && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Reviews</h3>
            <p className="text-2xl font-bold text-blue-600">{statistics.totalReviews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Average Rating</h3>
            <p className="text-2xl font-bold text-green-600">{statistics.averageRating}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Pending Reviews</h3>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pendingReviews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Verified Reviews</h3>
            <p className="text-2xl font-bold text-purple-600">{statistics.verifiedReviews}</p>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      {activeTab !== "statistics" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {review.comment}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={review.productId.image[0]}
                            alt={review.productId.name}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {review.productId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Size: {review.size}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{review.userId.name}</div>
                        <div className="text-sm text-gray-500">{review.userId.email}</div>
                        {review.verifiedPurchase && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {review.status === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedReview(review);
                                  setModerationData({ action: "approve", reason: "" });
                                  setShowModerateModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReview(review);
                                  setModerationData({ action: "reject", reason: "" });
                                  setShowModerateModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {review.status === "approved" && !review.businessResponse && (
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setResponseData({ response: "" });
                                setShowResponseModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Respond
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderate Modal */}
      {showModerateModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {moderationData.action === "approve" ? "Approve" : "Reject"} Review
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Review by {selectedReview.userId.name}:</p>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex mb-2">{renderStars(selectedReview.rating)}</div>
                <p className="font-medium">{selectedReview.title}</p>
                <p className="text-sm text-gray-600">{selectedReview.comment}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={moderationData.reason}
                onChange={(e) => setModerationData({ ...moderationData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Reason for moderation decision"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModerateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModerate}
                className={`px-4 py-2 text-white rounded-md ${
                  moderationData.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {moderationData.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Business Response</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Responding to review by {selectedReview.userId.name}:</p>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex mb-2">{renderStars(selectedReview.rating)}</div>
                <p className="font-medium">{selectedReview.title}</p>
                <p className="text-sm text-gray-600">{selectedReview.comment}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Response
              </label>
              <textarea
                value={responseData.response}
                onChange={(e) => setResponseData({ response: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={4}
                placeholder="Your response to this review"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResponse}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;