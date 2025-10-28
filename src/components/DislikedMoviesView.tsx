import React, { useState } from 'react';
import './DislikedMoviesView.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  overview?: string;
}

interface DislikedMoviesViewProps {
  movies: Movie[];
  onMoveToLiked: (movieId: string, title: string, posterPath: string) => void;
  onBackToHome: () => void;
  onKeepSearching: () => void;
}

const DislikedMoviesView: React.FC<DislikedMoviesViewProps> = ({
  movies,
  onMoveToLiked,
  onBackToHome,
  onKeepSearching
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleMoveToLiked = async (movie: Movie) => {
    const movieId = movie.tmdbId.toString();
    
    // Prevent double-clicking
    if (processingIds.has(movieId)) return;
    
    setProcessingIds(prev => new Set(prev).add(movieId));
    
    try {
      await onMoveToLiked(movieId, movie.title, movie.posterPath);
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

  return (
    <div className="disliked-movies-view">
      <div className="disliked-movies-content">
        <div className="disliked-movies-header">
          <h1 className="disliked-movies-title">Movies You Disliked</h1>
          <p className="disliked-movies-count">{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</p>
        </div>

      <div className="disliked-movies-grid">
        {movies.map((movie) => {
          const movieId = movie.tmdbId.toString();
          const isProcessing = processingIds.has(movieId);
          
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
                  className={`move-to-liked-button ${isProcessing ? 'processing' : ''}`}
                  onClick={() => handleMoveToLiked(movie)}
                  disabled={isProcessing}
                  title="Move to liked movies"
                >
                  <span className="move-icon">→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="disliked-movies-actions">
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

export default DislikedMoviesView;
