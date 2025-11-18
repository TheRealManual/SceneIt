import React, { useState } from 'react';
import './GameRatingModal.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
}

interface GameRatingModalProps {
  movies: Movie[];
  onSubmit: (rating: number, movieFeedback: { [movieId: number]: 'good' | 'bad' }) => void;
  onSkip: () => void;
}

const GameRatingModal: React.FC<GameRatingModalProps> = ({ movies, onSubmit, onSkip }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [movieFeedback, setMovieFeedback] = useState<{ [movieId: number]: 'good' | 'bad' }>({});

  const handleStarClick = (rating: number) => {
    setOverallRating(rating);
  };

  const handleMovieFeedback = (movieId: number, feedback: 'good' | 'bad') => {
    setMovieFeedback(prev => ({
      ...prev,
      [movieId]: prev[movieId] === feedback ? undefined : feedback
    } as { [movieId: number]: 'good' | 'bad' }));
  };

  const allMoviesRated = movies.every(movie => movieFeedback[movie.tmdbId]);
  const canSubmit = overallRating > 0 && allMoviesRated;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(overallRating, movieFeedback);
    }
  };

  return (
    <div className="game-rating-overlay">
      <div className="game-rating-modal">
        <h2 className="rating-title">Rate the Search</h2>
        <p className="rating-subtitle">Help us improve your recommendations</p>

        {/* Overall Rating Stars */}
        <div className="overall-rating-section">
          <p className="rating-label">Overall Experience</p>
          <div className="star-rating-large">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hoveredStar || overallRating) ? 'filled' : ''}`}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => handleStarClick(star)}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Movie Feedback List */}
        <div className="movie-feedback-section">
          <p className="rating-label">Rate Each Recommendation</p>
          <div className="movie-feedback-list">
            {movies.map((movie) => (
              <div key={movie.tmdbId} className="movie-feedback-item">
                <img 
                  src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                  alt={movie.title}
                  className="movie-feedback-poster"
                />
                <span className="movie-feedback-title">{movie.title}</span>
                <div className="movie-feedback-buttons">
                  <button
                    type="button"
                    className={`feedback-btn thumbs-down ${movieFeedback[movie.tmdbId] === 'bad' ? 'active' : ''}`}
                    onClick={() => handleMovieFeedback(movie.tmdbId, 'bad')}
                  >
                    👎
                  </button>
                  <button
                    type="button"
                    className={`feedback-btn thumbs-up ${movieFeedback[movie.tmdbId] === 'good' ? 'active' : ''}`}
                    onClick={() => handleMovieFeedback(movie.tmdbId, 'good')}
                  >
                    👍
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="rating-actions">
          <button
            type="button"
            className="rating-btn skip-btn"
            onClick={onSkip}
          >
            Skip
          </button>
          <button
            type="button"
            className={`rating-btn submit-btn ${canSubmit ? '' : 'disabled'}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameRatingModal;
