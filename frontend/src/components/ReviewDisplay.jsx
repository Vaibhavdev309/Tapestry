import React, { useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import toastService from "../utils/toastService";

const ReviewDisplay = ({ productId }) => {
  const { token } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rating: '',
    verifiedOnly: false,
    sortBy: 'helpful',
    page: 1
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [productId, filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: 5,
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.verifiedOnly && { verifiedOnly: 'true' }),
        sortBy: filters.sortBy
      });

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/api/reviews/product/${productId}?${params}`
      );

      if (response.data.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toastService.showError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!token) {
      toastService.showWarning("Please login to mark reviews as helpful");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/api/reviews/${reviewId}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update the review in the list
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId
              ? { ...review, helpful: response.data.helpful }
              : review
          )
        );
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      toastService.showError("Failed to mark review as helpful");
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

  const renderRatingDistribution = () => {
    if (!stats || !stats.ratingDistribution) return null;

    const { ratingDistribution, totalReviews } = stats;
    const ratings = [
      { stars: 5, count: ratingDistribution.five },
      { stars: 4, count: ratingDistribution.four },
      { stars: 3, count: ratingDistribution.three },
      { stars: 2, count: ratingDistribution.two },
      { stars: 1, count: ratingDistribution.one }
    ];

    return (
      <div className="space-y-2">
        {ratings.map(({ stars, count }) => (
          <div key={stars} className="flex items-center space-x-2">
            <span className="text-sm font-medium w-8">{stars}★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{
                  width: `${totalReviews > 0 ? (count / totalReviews) * 100 : 0}%`
                }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 w-8">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-6">Customer Reviews</h3>

      {/* Review Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-3xl font-bold">{stats.averageRating}</div>
              <div>
                <div className="flex">{renderStars(Math.round(stats.averageRating))}</div>
                <div className="text-sm text-gray-600">
                  Based on {stats.totalReviews} reviews
                </div>
                {stats.verifiedReviews > 0 && (
                  <div className="text-sm text-green-600">
                    {stats.verifiedReviews} verified purchases
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Rating Distribution</h4>
            {renderRatingDistribution()}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filters.rating}
          onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-md px-3 py-1"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-md px-3 py-1"
        >
          <option value="helpful">Most Helpful</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
        </select>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked, page: 1 })}
            className="rounded"
          />
          <span className="text-sm">Verified purchases only</span>
        </label>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews found for this product.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{review.userId.name}</span>
                    {review.verifiedPurchase && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-600">•</span>
                    <span className="text-sm text-gray-600">Size: {review.size}</span>
                  </div>
                </div>
              </div>

              <h4 className="font-medium mb-2">{review.title}</h4>
              <p className="text-gray-700 mb-3">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex space-x-2 mb-3">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`Review image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              )}

              {/* Business Response */}
              {review.businessResponse && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-blue-400 text-sm font-medium">Business Response</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">{review.businessResponse.response}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {new Date(review.businessResponse.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Helpful Button */}
              <div className="flex items-center space-x-4 mt-3">
                <button
                  onClick={() => handleMarkHelpful(review._id)}
                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center space-x-1"
                >
                  <span>👍</span>
                  <span>Helpful ({review.helpful?.count || 0})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setFilters({ ...filters, page: pageNum })}
                className={`px-3 py-1 border rounded ${
                  filters.page === pageNum
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.pages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewDisplay;