import React, { useState, useEffect } from 'react';
import './MovieSwiper.css';

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

interface MovieSwiperProps {
  movies: Movie[];
  onLike: (movie: Movie) => void;
  onDislike: (movie: Movie) => void;
  onFinish: () => void;
}

const MovieSwiper: React.FC<MovieSwiperProps> = ({ movies, onLike, onDislike, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);

  if (!movies || movies.length === 0) {
    return (
      <div className="movie-swiper-empty">
        <h2>No movies found</h2>
        <p>Try adjusting your preferences</p>
      </div>
    );
  }

  // Use useEffect to call onFinish when all movies are swiped
  useEffect(() => {
    if (currentIndex >= movies.length && movies.length > 0) {
      onFinish();
    }
  }, [currentIndex, movies.length, onFinish]);

  if (currentIndex >= movies.length) {
    return null;
  }

  const currentMovie = movies[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    // Set swipe direction for animation
    setSwipeDirection(direction);
    setIsDragging(false);
    // Keep dragOffset to continue from current position
    
    // Wait for animation to complete before moving to next card
    setTimeout(() => {
      if (direction === 'right') {
        onLike(currentMovie);
      } else {
        onDislike(currentMovie);
      }
      
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      setDragOffset(0);
    }, 400);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (swipeDirection) return; // Prevent interaction during animation
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || swipeDirection) return;
    
    const offset = e.clientX - startX;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!isDragging || swipeDirection) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(dragOffset) > threshold) {
      // Trigger swipe animation
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    } else {
      // Snap back to center
      setDragOffset(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swipeDirection) return; // Prevent interaction during animation
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || swipeDirection) return;
    
    const offset = e.touches[0].clientX - startX;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging || swipeDirection) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(dragOffset) > threshold) {
      // Trigger swipe animation
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    } else {
      // Snap back to center
      setDragOffset(0);
    }
  };

  const rotation = dragOffset / 20;

  return (
    <div className="movie-swiper-container">
      <div className="swiper-header">
        <h2>Swipe to Rate</h2>
        <p className="movie-counter">{currentIndex + 1} / {movies.length}</p>
      </div>

      <div className="swiper-main">
        <div 
          className={`movie-card-swiper ${swipeDirection ? `swiping-${swipeDirection}` : ''} ${isDragging ? 'dragging' : ''}`}
          style={{
            transform: swipeDirection 
              ? `translateX(${swipeDirection === 'right' ? '150%' : '-150%'}) rotate(${swipeDirection === 'right' ? '20deg' : '-20deg'})`
              : `translateX(${dragOffset}px) rotate(${rotation}deg)`,
            opacity: swipeDirection ? 0 : 1,
            transition: swipeDirection 
              ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out' 
              : isDragging ? 'none' : 'transform 0.3s ease-out',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="movie-poster-swiper">
            <img 
              src={`https://image.tmdb.org/t/p/w500${currentMovie.posterPath}`}
              alt={currentMovie.title}
              draggable={false}
            />
            
            {/* Swipe Indicators */}
            <div 
              className={`swipe-indicator like-indicator ${swipeDirection === 'right' ? 'active' : ''}`}
              style={{ opacity: swipeDirection === 'right' ? 1 : Math.max(0, dragOffset / 200) }}
            >
              <span className="indicator-icon">❤️</span>
              <span className="indicator-text">LIKE</span>
            </div>
            <div 
              className={`swipe-indicator dislike-indicator ${swipeDirection === 'left' ? 'active' : ''}`}
              style={{ opacity: swipeDirection === 'left' ? 1 : Math.max(0, -dragOffset / 200) }}
            >
              <span className="indicator-icon">👎</span>
              <span className="indicator-text">PASS</span>
            </div>
          </div>

          <div className="movie-info-swiper">
            <h3 className="movie-title-swiper">{currentMovie.title}</h3>
            
            <div className="movie-meta">
              {currentMovie.releaseDate && (
                <span className="meta-item">
                  📅 {new Date(currentMovie.releaseDate).getFullYear()}
                </span>
              )}
              {currentMovie.runtime && (
                <span className="meta-item">
                  ⏱️ {currentMovie.runtime}min
                </span>
              )}
              {currentMovie.voteAverage && (
                <span className="meta-item">
                  ⭐ {currentMovie.voteAverage.toFixed(1)}
                </span>
              )}
            </div>

            {currentMovie.genres && currentMovie.genres.length > 0 && (
              <div className="movie-genres">
                {currentMovie.genres.slice(0, 3).map(genre => (
                  <span key={genre.id} className="genre-tag">{genre.name}</span>
                ))}
              </div>
            )}

            <p className="movie-overview">{currentMovie.overview}</p>
          </div>
        </div>

        {/* Next card preview */}
        {currentIndex + 1 < movies.length && (
          <div className="movie-card-preview">
            <img 
              src={`https://image.tmdb.org/t/p/w500${movies[currentIndex + 1].posterPath}`}
              alt={movies[currentIndex + 1].title}
            />
          </div>
        )}
      </div>

      <div className="swiper-actions">
        <button 
          className="action-btn dislike-btn"
          onClick={() => handleSwipe('left')}
        >
          <span className="btn-icon">👎</span>
          <span className="btn-label">Pass</span>
        </button>

        <button 
          className="action-btn like-btn"
          onClick={() => handleSwipe('right')}
        >
          <span className="btn-icon">❤️</span>
          <span className="btn-label">Like</span>
        </button>
      </div>
    </div>
  );
};

export default MovieSwiper;
