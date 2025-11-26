import React, { useState } from 'react';
import './RatingModal.css';

interface RatingModalProps {
  movieTitle: string;
  initialRating?: number;
  onSubmit: (rating: number, preference?: 'like' | 'dislike') => void;
  onClose: () => void;
  showPreference?: boolean; // Show like/dislike options when in game mode
}

const RatingModal: React.FC<RatingModalProps> = ({ 
  movieTitle, 
  initialRating = 0,
  onSubmit, 
  onClose,
  showPreference = false
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [preference, setPreference] = useState<'like' | 'dislike' | null>(null);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleStarHover = (value: number) => {
    setHoverRating(value);
  };

  const handleSubmit = () => {
    if (rating > 0) {
      if (showPreference && preference) {
        onSubmit(rating, preference);
      } else if (!showPreference) {
        onSubmit(rating);
      }
      // Don't submit if showPreference is true but no preference selected
    }
  };

  const renderStar = (position: number) => {
    const displayRating = hoverRating || rating;
    const leftValue = position - 0.5;
    const rightValue = position;
    
    const leftFilled = displayRating >= leftValue;
    const rightFilled = displayRating >= rightValue;

    return (
      <div className="star-container" key={position}>
        {/* Left half of star (for 0.5 rating) */}
        <div 
          className="star-half star-left"
          onClick={() => handleStarClick(leftValue)}
          onMouseEnter={() => handleStarHover(leftValue)}
        >
          <span className={`star ${leftFilled ? 'filled' : ''}`}>
            {leftFilled ? '★' : '☆'}
          </span>
        </div>
        {/* Right half of star (for full rating) */}
        <div 
          className="star-half star-right"
          onClick={() => handleStarClick(rightValue)}
          onMouseEnter={() => handleStarHover(rightValue)}
        >
          <span className={`star ${rightFilled ? 'filled' : ''}`}>
            {rightFilled ? '★' : '☆'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rating-modal-close" onClick={onClose}>×</button>
        
        <h2 className="rating-modal-title">Rate this movie</h2>
        <p className="rating-modal-movie-title">{movieTitle}</p>
        
        <div 
          className="rating-stars"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map(position => renderStar(position))}
        </div>
        
        <p className="rating-display">
          {(hoverRating || rating) > 0 ? (hoverRating || rating).toFixed(1) : 'Select a rating'}
        </p>
        
        {showPreference && (
          <div className="preference-selection">
            <p className="preference-label">Add to your list?</p>
            <div className="preference-buttons">
              <button
                className={`preference-button preference-like ${preference === 'like' ? 'selected' : ''}`}
                onClick={() => setPreference('like')}
              >
                <span className="preference-icon">❤️</span>
              </button>
              <button
                className={`preference-button preference-dislike ${preference === 'dislike' ? 'selected' : ''}`}
                onClick={() => setPreference('dislike')}
              >
                <span className="preference-icon">👎</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="rating-modal-actions">
          <button 
            className="rating-modal-button rating-modal-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="rating-modal-button rating-modal-submit" 
            onClick={handleSubmit}
            disabled={rating === 0 || (showPreference && !preference)}
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
