import { useState, useEffect } from 'react';
import './MovieModal.css';
import RatingModal from './RatingModal';
import StarRating from './StarRating';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  overview: string;
  releaseDate?: string;
  genres?: Array<{ id: number; name: string }>;
  voteAverage?: number;
  runtime?: number;
}

interface MovieModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  onLike: (movie: Movie) => void;
  onDislike: (movie: Movie) => void;
  onFavorite?: (movie: Movie) => void;
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, rating: number) => void;
  isFavorited?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  userRating?: number;
  averageRating?: number;
}

const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  isOpen,
  onClose,
  onLike,
  onDislike,
  onFavorite,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  isFavorited = false,
  isLiked = false,
  isDisliked = false,
  userRating,
  averageRating
}) => {
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localIsDisliked, setLocalIsDisliked] = useState(isDisliked);
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [localUserRating, setLocalUserRating] = useState(userRating);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoveredWatchedButton, setHoveredWatchedButton] = useState(false);

  // Prevent body scroll when modal is open and scroll to top
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Sync local state with props when they change
  useEffect(() => {
    setLocalIsLiked(isLiked);
    setLocalIsDisliked(isDisliked);
    setLocalIsFavorited(isFavorited);
    setLocalUserRating(userRating);
  }, [isLiked, isDisliked, isFavorited, userRating]);

  if (!isOpen) return null;

  console.log('🎬 Modal opened with movie:', movie.title);
  console.log('🖼️ Movie posterPath:', movie.posterPath);
  console.log('📊 Movie data:', movie);

  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  console.log('🖼️ Final poster URL:', posterUrl);

  const handleLike = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onLike(movie);
    setLocalIsLiked(true);
    setIsProcessing(false);
  };

  const handleDislike = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onDislike(movie);
    setLocalIsDisliked(true);
    setIsProcessing(false);
  };

  const handleFavorite = async () => {
    if (!onFavorite || isProcessing) return;
    setIsProcessing(true);
    await onFavorite(movie);
    setLocalIsFavorited(!localIsFavorited);
    setIsProcessing(false);
  };

  const handleWatchClick = () => {
    // Show modal to add or update rating
    setShowRatingModal(true);
  };

  const handleUnwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnwatch && localUserRating) {
      onUnwatch(movie.tmdbId.toString());
      setLocalUserRating(undefined);
    }
  };

  const handleRatingSubmit = (rating: number, preference?: 'like' | 'dislike') => {
    if (localUserRating && onUpdateWatchedRating) {
      // Update existing rating
      onUpdateWatchedRating(movie.tmdbId.toString(), rating);
      setLocalUserRating(rating);
    } else if (onWatch) {
      // Add new watched movie
      onWatch(movie, rating);
      setLocalUserRating(rating);
      
      // Handle preference selection if provided
      if (preference === 'like' && !localIsLiked && !localIsDisliked) {
        onLike(movie);
        setLocalIsLiked(true);
      } else if (preference === 'dislike' && !localIsLiked && !localIsDisliked) {
        onDislike(movie);
        setLocalIsDisliked(true);
      }
    }
    setShowRatingModal(false);
  };

  const handleRatingCancel = () => {
    setShowRatingModal(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="movie-modal-overlay" onClick={handleBackdropClick}>
      <div className="movie-modal-content" onClick={handleContentClick}>
        <button className="modal-close-btn" onClick={handleClose}>
          ✕
        </button>

        <div className="modal-movie-card">
          {/* Dislike Button - Top Left */}
          <button
            className={`modal-dislike-button ${localIsDisliked ? 'disliked' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleDislike}
            disabled={isProcessing || localIsDisliked}
            title="Dislike this movie"
          >
            <span className="modal-btn-icon">👎</span>
          </button>

          {/* Like Button - Top Right */}
          <button
            className={`modal-like-button ${localIsLiked ? 'liked' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleLike}
            disabled={isProcessing || localIsLiked}
            title="Like this movie"
          >
            <span className="modal-btn-icon">👍</span>
          </button>

          {/* Favorite Button - Bottom Right (only shows if movie is liked) */}
          {localIsLiked && onFavorite && (
            <button
              className={`modal-favorite-button ${localIsFavorited ? 'favorited' : ''} ${isProcessing ? 'processing' : ''}`}
              onClick={handleFavorite}
              disabled={isProcessing}
              title={localIsFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className="modal-fav-icon">{localIsFavorited ? '❤️' : '🤍'}</span>
            </button>
          )}

          {/* Watched Button - Bottom Right, moves left when favorite shows */}
          <button
            className={`modal-watched-button ${localUserRating ? 'watched' : ''}`}
            onClick={(e) => localUserRating ? handleUnwatchClick(e) : handleWatchClick()}
            onMouseEnter={() => setHoveredWatchedButton(true)}
            onMouseLeave={() => setHoveredWatchedButton(false)}
            title={localUserRating ? 'Click to unwatch' : 'Mark as watched'}
          >
            <span className="modal-watched-icon">🎬</span>
            <div className={`rating-wrapper ${localUserRating || (hoveredWatchedButton && averageRating) ? 'show' : ''}`}>
              {localUserRating ? (
                <StarRating rating={localUserRating} size="small" />
              ) : hoveredWatchedButton && averageRating ? (
                <StarRating rating={averageRating} size="small" />
              ) : null}
            </div>
          </button>

          <div className="modal-movie-poster">
            <img 
              src={posterUrl}
              alt={movie.title}
              onError={(e) => {
                console.error('❌ Failed to load poster:', posterUrl);
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Poster';
              }}
              onLoad={() => console.log('✅ Poster loaded successfully:', posterUrl)}
            />
          </div>

          <div className="modal-movie-info">
            <h2 className="modal-movie-title">{movie.title}</h2>
            
            <div className="modal-movie-meta">
              {movie.releaseDate && (
                <span className="modal-meta-item">
                  📅 {new Date(movie.releaseDate).getFullYear()}
                </span>
              )}
              {movie.runtime && (
                <span className="modal-meta-item">
                  ⏱️ {movie.runtime}min
                </span>
              )}
              {movie.voteAverage && (
                <span className="modal-meta-item">
                  ⭐ {movie.voteAverage.toFixed(1)}
                </span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="modal-movie-genres">
                {movie.genres.slice(0, 3).map(genre => (
                  <span key={genre.id} className="modal-genre-tag">{genre.name}</span>
                ))}
              </div>
            )}

            <p className="modal-movie-overview">{movie.overview}</p>
          </div>

          {/* Rating Modal - inside card for proper positioning */}
          {showRatingModal && (
            <div className="nested-rating-modal-container">
              <RatingModal
                movieTitle={movie.title}
                initialRating={localUserRating}
                onSubmit={handleRatingSubmit}
                onClose={handleRatingCancel}
                showPreference={!localIsLiked && !localIsDisliked}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
