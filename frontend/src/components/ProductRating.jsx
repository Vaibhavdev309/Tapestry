import React from "react";

const ProductRating = ({ rating, reviewCount, showCount = true, size = "md" }) => {
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, index) => (
          <span key={index} className="text-yellow-400">
            ★
          </span>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <span className="text-yellow-400 relative">
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              ★
            </span>
            <span className="text-gray-300">★</span>
          </span>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, index) => (
          <span key={index} className="text-gray-300">
            ★
          </span>
        ))}
      </div>
    );
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-xl";
      case "xl":
        return "text-2xl";
      default:
        return "text-base";
    }
  };

  const getStarSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      case "xl":
        return "text-xl";
      default:
        return "text-base";
    }
  };

  if (!rating && rating !== 0) {
    return (
      <div className={`flex items-center space-x-2 ${getSizeClasses()}`}>
        <div className={`flex ${getStarSizeClasses()}`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="text-gray-300">
              ★
            </span>
          ))}
        </div>
        {showCount && (
          <span className="text-gray-500">No reviews yet</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${getSizeClasses()}`}>
      <div className={`flex ${getStarSizeClasses()}`}>
        {renderStars(rating)}
      </div>
      <span className="font-medium text-gray-700">
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount > 0 && (
        <span className="text-gray-500">
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default ProductRating;