import { useState, useEffect } from 'react';
import './MovieModal.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  overview?: string;
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
  isFavorited?: boolean;
  isLiked?: boolean;
}

const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  isOpen,
  onClose,
  onLike,
  onDislike,
  onFavorite,
  isFavorited = false,
  isLiked = false
}) => {
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(false);
    // Close modal after disliking
    setTimeout(() => onClose(), 300);
  };

  const handleFavorite = async () => {
    if (!onFavorite || isProcessing) return;
    setIsProcessing(true);
    await onFavorite(movie);
    setLocalIsFavorited(!localIsFavorited);
    setIsProcessing(false);
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
            className={`modal-dislike-button ${isProcessing ? 'processing' : ''}`}
            onClick={handleDislike}
            disabled={isProcessing}
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
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
