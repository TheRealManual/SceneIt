import React, { useState } from 'react';
import './LikedMoviesView.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  overview?: string;
}

interface LikedMoviesViewProps {
  movies: Movie[];
  favoriteMovies: Movie[];
  dislikedMovies?: Movie[];
  onAddToFavorites: (movieId: string, title: string, posterPath: string) => void;
  onRemoveFromFavorites: (movieId: string) => void;
  onMoveToDisliked: (movieId: string, title: string, posterPath: string) => void;
  onMoveToLiked?: (movieId: string, title: string, posterPath: string) => void;
  onBackToHome: () => void;
  onKeepSearching: () => void;
  favoriteMovieIds: Set<string>;
}

const LikedMoviesView: React.FC<LikedMoviesViewProps> = ({
  movies,
  favoriteMovies,
  dislikedMovies = [],
  onAddToFavorites,
  onRemoveFromFavorites,
  onMoveToDisliked,
  onMoveToLiked,
  onBackToHome,
  onKeepSearching,
  favoriteMovieIds
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());

  const handleFavoriteClick = async (movie: Movie) => {
    const movieId = movie.tmdbId.toString();
    
    // Prevent double-clicking
    if (processingIds.has(movieId)) return;
    
    setProcessingIds(prev => new Set(prev).add(movieId));
    
    try {
      const isFavorite = favoriteMovieIds.has(movieId);
      if (isFavorite) {
        await onRemoveFromFavorites(movieId);
      } else {
        await onAddToFavorites(movieId, movie.title, movie.posterPath);
      }
    } finally {
      // Remove from processing after animation completes
      setTimeout(() => {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
      }, 600);
    }
  };

  const handleMoveToDisliked = async (movie: Movie) => {
    const movieId = movie.tmdbId.toString();
    
    // Prevent double-clicking
    if (movingIds.has(movieId)) return;
    
    setMovingIds(prev => new Set(prev).add(movieId));
    
    try {
      await onMoveToDisliked(movieId, movie.title, movie.posterPath);
    } finally {
      setTimeout(() => {
        setMovingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
      }, 600);
    }
  };

  const handleMoveToLiked = async (movie: Movie) => {
    if (!onMoveToLiked) return;
    
    const movieId = movie.tmdbId.toString();
    
    // Prevent double-clicking
    if (movingIds.has(movieId)) return;
    
    setMovingIds(prev => new Set(prev).add(movieId));
    
    try {
      await onMoveToLiked(movieId, movie.title, movie.posterPath);
    } finally {
      setTimeout(() => {
        setMovingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
      }, 600);
    }
  };

  return (
    <div className="liked-movies-view">
      <div className="liked-movies-content">
        
        {/* Favorited Movies Section */}
        {favoriteMovies.length > 0 && (
          <div className="favorites-section">
            <div className="section-header">
              <h2 className="section-title">⭐ Your Favorite Movies</h2>
              <p className="section-count">{favoriteMovies.length} {favoriteMovies.length === 1 ? 'favorite' : 'favorites'}</p>
            </div>

            <div className="liked-movies-grid">
              {favoriteMovies.map((movie) => {
                const movieId = movie.tmdbId.toString();
                const isProcessing = processingIds.has(movieId);
                const isMoving = movingIds.has(movieId);
                
                return (
                  <div key={movie.tmdbId} className="movie-card">
                    <div className="movie-poster-container">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                        alt={movie.title}
                        className="movie-poster"
                      />
                      <div className="movie-overlay">
                        <h3 className="movie-title">{movie.title}</h3>
                        {movie.releaseDate && (
                          <p className="movie-year">
                            {new Date(movie.releaseDate).getFullYear()}
                          </p>
                        )}
                      </div>
                      <button
                        className={`move-to-disliked-button ${isMoving ? 'processing' : ''}`}
                        onClick={() => handleMoveToDisliked(movie)}
                        disabled={isMoving}
                        title="Move to disliked movies"
                      >
                        <span className="move-icon">→</span>
                      </button>
                      <button
                        className={`favorite-button favorited ${isProcessing ? 'processing' : ''}`}
                        onClick={() => handleFavoriteClick(movie)}
                        disabled={isProcessing}
                        title="Remove from favorites"
                      >
                        <span className="favorite-icon favorited">♥</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Liked Movies Section */}
        <div className="liked-section">
          <div className="section-header">
            <h2 className="section-title">❤️ Movies You Liked</h2>
            <p className="section-count">{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</p>
          </div>

      <div className="liked-movies-grid">
        {movies.map((movie) => {
          const movieId = movie.tmdbId.toString();
          const isFavorite = favoriteMovieIds.has(movieId);
          const isProcessing = processingIds.has(movieId);
          const isMoving = movingIds.has(movieId);
          
          return (
            <div key={movie.tmdbId} className="movie-card">
              <div className="movie-poster-container">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                  alt={movie.title}
                  className="movie-poster"
                />
                <div className="movie-overlay">
                  <h3 className="movie-title">{movie.title}</h3>
                  {movie.releaseDate && (
                    <p className="movie-year">
                      {new Date(movie.releaseDate).getFullYear()}
                    </p>
                  )}
                </div>
                <button
                  className={`move-to-disliked-button ${isMoving ? 'processing' : ''}`}
                  onClick={() => handleMoveToDisliked(movie)}
                  disabled={isMoving}
                  title="Move to disliked movies"
                >
                  <span className="move-icon">→</span>
                </button>
                <button
                  className={`favorite-button ${isFavorite ? 'favorited' : ''} ${isProcessing ? 'processing' : ''}`}
                  onClick={() => handleFavoriteClick(movie)}
                  disabled={isProcessing}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isProcessing ? (
                    <span className="favorite-icon processing">✓</span>
                  ) : isFavorite ? (
                    <span className="favorite-icon favorited">♥</span>
                  ) : (
                    <span className="favorite-icon">♡</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
        </div>

        {/* Disliked Movies Section */}
        {dislikedMovies.length > 0 && (
          <div className="disliked-section">
            <div className="section-header">
              <h2 className="section-title">👎 Movies You Disliked</h2>
              <p className="section-count">{dislikedMovies.length} {dislikedMovies.length === 1 ? 'movie' : 'movies'}</p>
            </div>

            <div className="liked-movies-grid">
              {dislikedMovies.map((movie) => {
                const movieId = movie.tmdbId.toString();
                const isMoving = movingIds.has(movieId);
                
                return (
                  <div key={movie.tmdbId} className="movie-card">
                    <div className="movie-poster-container">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                        alt={movie.title}
                        className="movie-poster"
                      />
                      <div className="movie-overlay">
                        <h3 className="movie-title">{movie.title}</h3>
                        {movie.releaseDate && (
                          <p className="movie-year">
                            {new Date(movie.releaseDate).getFullYear()}
                          </p>
                        )}
                      </div>
                      {onMoveToLiked && (
                        <button
                          className={`move-to-liked-button ${isMoving ? 'processing' : ''}`}
                          onClick={() => handleMoveToLiked(movie)}
                          disabled={isMoving}
                          title="Move to liked movies"
                        >
                          <span className="move-icon">→</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      <div className="liked-movies-actions">
        <button className="action-button secondary" onClick={onBackToHome}>
          <span className="button-icon">🏠</span>
          Start New Search
        </button>
        <button className="action-button primary" onClick={onKeepSearching}>
          <span className="button-icon">🔍</span>
          Keep Searching
        </button>
      </div>
      </div>
    </div>
  );
};

export default LikedMoviesView;
