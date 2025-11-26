import React, { useState, useEffect } from 'react';
import './MovieSwiper.css';
import RatingModal from './RatingModal';

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
  onWatch?: (movie: Movie, rating: number) => void;
  onFinish: () => void;
}

const MovieSwiper: React.FC<MovieSwiperProps> = ({ movies, onLike, onDislike, onWatch, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingWatchMovie, setPendingWatchMovie] = useState<Movie | null>(null);

  // Log movies received by the carousel
  useEffect(() => {
    console.log('🎭 MovieSwiper received movies:', movies.map(m => `${m.tmdbId} (${m.title})`));
  }, [movies]);

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

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    // Prevent multiple simultaneous swipes
    if (isAnimating || swipeDirection) return;
    
    // Set animation flag and swipe direction
    setIsAnimating(true);
    setSwipeDirection(direction);
    setIsDragging(false);
    // Keep dragOffset to continue from current position
    
    // Wait for animation to complete before moving to next card
    setTimeout(() => {
      if (direction === 'right') {
        onLike(currentMovie);
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
        setDragOffset({ x: 0, y: 0 });
        setIsAnimating(false);
      } else if (direction === 'left') {
        onDislike(currentMovie);
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
        setDragOffset({ x: 0, y: 0 });
        setIsAnimating(false);
      } else if (direction === 'up') {
        // Show rating modal for watched movies - keep card slid up
        setPendingWatchMovie(currentMovie);
        setShowRatingModal(true);
        // Don't reset swipeDirection or isAnimating - keep card in up position
      }
    }, 400);
  };

  const handleWatchSubmit = (rating: number, preference?: 'like' | 'dislike') => {
    if (pendingWatchMovie && onWatch) {
      onWatch(pendingWatchMovie, rating);
      
      // Handle like/dislike preference from game mode
      if (preference === 'like') {
        onLike(pendingWatchMovie);
      } else if (preference === 'dislike') {
        onDislike(pendingWatchMovie);
      }
      
      // Complete the slide-up animation and move to next card
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
        setDragOffset({ x: 0, y: 0 });
        setIsAnimating(false);
        setShowRatingModal(false);
        setPendingWatchMovie(null);
      }, 300);
    }
  };

  const handleWatchCancel = () => {
    // Slide card back down
    setSwipeDirection(null);
    setDragOffset({ x: 0, y: 0 });
    setIsAnimating(false);
    setShowRatingModal(false);
    setPendingWatchMovie(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (swipeDirection) return; // Prevent interaction during animation
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || swipeDirection) return;
    
    const offsetX = e.clientX - startPos.x;
    const offsetY = e.clientY - startPos.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseUp = () => {
    if (!isDragging || swipeDirection) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    // Check for upward swipe first
    if (dragOffset.y < -threshold && Math.abs(dragOffset.x) < threshold) {
      handleSwipe('up');
    } else if (Math.abs(dragOffset.x) > threshold) {
      // Trigger horizontal swipe animation
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swipeDirection) return; // Prevent interaction during animation
    setIsDragging(true);
    setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || swipeDirection) return;
    
    const offsetX = e.touches[0].clientX - startPos.x;
    const offsetY = e.touches[0].clientY - startPos.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleTouchEnd = () => {
    if (!isDragging || swipeDirection) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    // Check for upward swipe first
    if (dragOffset.y < -threshold && Math.abs(dragOffset.x) < threshold) {
      handleSwipe('up');
    } else if (Math.abs(dragOffset.x) > threshold) {
      // Trigger horizontal swipe animation
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const rotation = dragOffset.x / 20;

  return (
    <div className="movie-swiper-container">
      <div className="swiper-header">
        <h2>Swipe to Rate</h2>
        <p className="movie-counter">{currentIndex + 1} / {movies.length}</p>
      </div>

      <div className="swiper-main">
        <button
          type="button"
          className="side-action-btn dislike"
          onClick={() => handleSwipe('left')}
        >
          <span className="btn-icon">👎</span>
        </button>

        <div 
          className={`movie-card-swiper ${swipeDirection ? `swiping-${swipeDirection}` : ''} ${isDragging ? 'dragging' : ''}`}
          style={{
            transform: swipeDirection 
              ? swipeDirection === 'up'
                ? `translateY(-150%) scale(0.8)`
                : `translateX(${swipeDirection === 'right' ? '150%' : '-150%'}) rotate(${swipeDirection === 'right' ? '20deg' : '-20deg'})`
              : `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
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
              style={{ opacity: swipeDirection === 'right' ? 1 : Math.max(0, dragOffset.x / 200) }}
            >
              <span className="indicator-icon">❤️</span>
            </div>
            <div 
              className={`swipe-indicator dislike-indicator ${swipeDirection === 'left' ? 'active' : ''}`}
              style={{ opacity: swipeDirection === 'left' ? 1 : Math.max(0, -dragOffset.x / 200) }}
            >
              <span className="indicator-icon">👎</span>
            </div>
            <div 
              className={`swipe-indicator watch-indicator ${swipeDirection === 'up' ? 'active' : ''}`}
              style={{ opacity: swipeDirection === 'up' ? 1 : Math.max(0, -dragOffset.y / 200) }}
            >
              <span className="indicator-icon">🎬</span>
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

        <button
          type="button"
          className="side-action-btn like"
          onClick={() => handleSwipe('right')}
        >
          <span className="btn-icon">❤️</span>
        </button>

        {/* Watched Button - positioned relative to the card */}
        <button
          type="button"
          className="watched-button"
          onClick={() => handleSwipe('up')}
        >
          <span className="watched-icon">🎬</span>
        </button>
      </div>

      {/* Rating Modal */}
      {showRatingModal && pendingWatchMovie && (
        <RatingModal
          movieTitle={pendingWatchMovie.title}
          onSubmit={handleWatchSubmit}
          onClose={handleWatchCancel}
          showPreference={true}
        />
      )}
    </div>
  );
};

export default MovieSwiper;
