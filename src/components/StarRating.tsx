import React from 'react';
import './StarRating.css';

interface StarRatingProps {
  rating: number; // 0 to 5, supports 0.5 increments
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  count?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 'medium',
  showCount = false,
  count = 0
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        // Full star
        stars.push(
          <span key={i} className="star-rating-star filled">★</span>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Half star
        stars.push(
          <span key={i} className="star-rating-star half">
            <span className="star-rating-half-fill">★</span>
            <span className="star-rating-half-empty">☆</span>
          </span>
        );
      } else {
        // Empty star
        stars.push(
          <span key={i} className="star-rating-star empty">☆</span>
        );
      }
    }

    return stars;
  };

  return (
    <div className={`star-rating-display ${size}`}>
      <div className="star-rating-stars">
        {renderStars()}
      </div>
      {showCount && count > 0 && (
        <span className="star-rating-count">({count})</span>
      )}
    </div>
  );
};

export default StarRating;
