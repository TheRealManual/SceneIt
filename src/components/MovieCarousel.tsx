import { useState, useEffect } from 'react';
import { movieCacheService } from '../services/movieCache.service';
import MovieModal from './MovieModal';
import './MovieCarousel.css';

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

interface MovieCarouselProps {
  onLike?: (movie: Movie) => void;
  onDislike?: (movie: Movie) => void;
  onFavorite?: (movie: Movie) => void;
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, rating: number) => void;
  likedMovieIds?: Set<string>;
  dislikedMovieIds?: Set<string>;
  favoriteMovieIds?: Set<string>;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ 
  onLike, 
  onDislike, 
  onFavorite,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  likedMovieIds,
  dislikedMovieIds,
  favoriteMovieIds
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailedMovie, setDetailedMovie] = useState<Movie | null>(null);
  const [localLikedIds, setLocalLikedIds] = useState<Set<string>>(new Set());
  const [localDislikedIds, setLocalDislikedIds] = useState<Set<string>>(new Set());
  const [localFavoriteIds, setLocalFavoriteIds] = useState<Set<string>>(new Set());
  const [localWatchedRatings, setLocalWatchedRatings] = useState<Map<string, number>>(new Map());

  // Sync local state with props (merge instead of replace)
  useEffect(() => {
    if (likedMovieIds) {
      setLocalLikedIds(prev => {
        const merged = new Set(prev);
        likedMovieIds.forEach(id => merged.add(id));
        return merged;
      });
    }
    if (dislikedMovieIds) {
      setLocalDislikedIds(prev => {
        const merged = new Set(prev);
        dislikedMovieIds.forEach(id => merged.add(id));
        return merged;
      });
    }
    if (favoriteMovieIds) {
      setLocalFavoriteIds(prev => {
        const merged = new Set(prev);
        favoriteMovieIds.forEach(id => merged.add(id));
        return merged;
      });
    }
  }, [likedMovieIds, dislikedMovieIds, favoriteMovieIds]);

  // Fetch watched movies on mount
  useEffect(() => {
    const fetchWatchedMovies = async () => {
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/user/movies/watched`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const ratingsMap = new Map<string, number>();
          data.watchedMovies?.forEach((movie: any) => {
            ratingsMap.set(movie.tmdbId.toString(), movie.userRating);
          });
          setLocalWatchedRatings(ratingsMap);
        }
      } catch (error) {
        console.error('Failed to fetch watched movies:', error);
      }
    };

    fetchWatchedMovies();
  }, []);

  useEffect(() => {
    // Fetch random movies for carousel
    const fetchRandomMovies = async () => {
      // Check cache first
      const cacheKey = 'home-carousel-movies';
      const cachedMovies = movieCacheService.getCachedMovies(cacheKey);
      
      if (cachedMovies) {
        console.log('🎠 Using cached home carousel movies!', cachedMovies.length, 'movies');
        const moviesWithPosters = cachedMovies.filter((m: Movie) => m.posterPath);
        setMovies([...moviesWithPosters, ...moviesWithPosters, ...moviesWithPosters]); // Triple for smoother loop
        setLoading(false);
        return;
      }

      console.log('🎠 No cached home carousel movies, fetching...');
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/movies/random?count=30`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🎬 Fetched Home Carousel Movie IDs:', data.movies.map((m: any) => `${m.tmdbId} (${m.title})`));
          // Cache the carousel movies
          movieCacheService.setCachedMovies(cacheKey, data.movies);
          // Filter movies with posters only
          const moviesWithPosters = data.movies.filter((m: Movie) => m.posterPath);
          // Triple the movies array to create seamless loop
          setMovies([...moviesWithPosters, ...moviesWithPosters, ...moviesWithPosters]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch random movies:', error);
        setLoading(false);
      }
    };

    fetchRandomMovies();
  }, []);

  const getPosterUrl = (posterPath: string) => {
    if (!posterPath) return 'https://via.placeholder.com/500x750?text=No+Poster';
    return `https://image.tmdb.org/t/p/w342${posterPath}`;
  };

  const handleMovieClick = async (movie: Movie) => {
    console.log('🎬 Clicked movie:', movie.title, 'tmdbId:', movie.tmdbId);
    console.log('🖼️ Poster path:', movie.posterPath);
    
    // Fetch full movie details
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      console.log('📡 Fetching from:', `${backendUrl}/api/movies/${movie.tmdbId}`);
      
      const response = await fetch(`${backendUrl}/api/movies/${movie.tmdbId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Movie details response:', data);
        
        // The API returns { success: true, movie: {...} }
        const movieDetails = data.movie || data;
        console.log('🎥 Detailed movie data:', movieDetails);
        console.log('🖼️ Detailed poster path:', movieDetails.posterPath);
        
        setDetailedMovie(movieDetails);
        setIsModalOpen(true);
      } else {
        console.error('❌ Failed to fetch movie details, status:', response.status);
        // Fallback to basic movie info
        setDetailedMovie(movie);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Failed to fetch movie details:', error);
      // Fallback to basic movie info
      setDetailedMovie(movie);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDetailedMovie(null);
  };

  const handleLike = async (movie: Movie) => {
    if (onLike) {
      await onLike(movie);
      // Update local state immediately
      setLocalLikedIds(prev => new Set(prev).add(movie.tmdbId.toString()));
      setLocalDislikedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(movie.tmdbId.toString());
        return newSet;
      });
    }
  };

  const handleDislike = async (movie: Movie) => {
    if (onDislike) {
      await onDislike(movie);
      // Update local state immediately
      setLocalDislikedIds(prev => new Set(prev).add(movie.tmdbId.toString()));
      setLocalLikedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(movie.tmdbId.toString());
        return newSet;
      });
      // Remove from favorites when disliking
      setLocalFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(movie.tmdbId.toString());
        return newSet;
      });
    }
  };

  const handleFavorite = async (movie: Movie) => {
    if (onFavorite) {
      const movieId = movie.tmdbId.toString();
      const wasFavorited = localFavoriteIds.has(movieId);
      
      await onFavorite(movie);
      
      // Toggle favorite in local state
      if (wasFavorited) {
        setLocalFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
      } else {
        setLocalFavoriteIds(prev => new Set(prev).add(movieId));
      }
    }
  };

  const handleWatch = async (movie: Movie, rating: number) => {
    if (onWatch) {
      await onWatch(movie, rating);
      // Update local state immediately
      setLocalWatchedRatings(prev => new Map(prev).set(movie.tmdbId.toString(), rating));
    }
  };

  const handleUnwatch = async (movieId: string) => {
    if (onUnwatch) {
      await onUnwatch(movieId);
      // Update local state immediately
      setLocalWatchedRatings(prev => {
        const newMap = new Map(prev);
        newMap.delete(movieId);
        return newMap;
      });
    }
  };

  const handleUpdateWatchedRating = async (movieId: string, rating: number) => {
    if (onUpdateWatchedRating) {
      await onUpdateWatchedRating(movieId, rating);
      // Update local state immediately
      setLocalWatchedRatings(prev => new Map(prev).set(movieId, rating));
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (movies.length === 0) {
    return null; // Don't show carousel if no movies
  }

  return (
    <>
      <div className="home-movie-carousel">
        <div className="home-carousel-track">
          {movies.map((movie, index) => (
            <div 
              key={`${movie.tmdbId}-${index}`}
              className="home-carousel-item"
              onClick={() => handleMovieClick(movie)}
            >
              <img 
                src={getPosterUrl(movie.posterPath)} 
                alt={movie.title}
                className="home-poster-image"
                loading="lazy"
              />
              <div className="home-movie-overlay">
                <h3 className="home-movie-title">{movie.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {detailedMovie && (
        <MovieModal
          movie={detailedMovie}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onLike={handleLike}
          onDislike={handleDislike}
          onFavorite={handleFavorite}
          onWatch={handleWatch}
          onUnwatch={handleUnwatch}
          onUpdateWatchedRating={handleUpdateWatchedRating}
          isLiked={localLikedIds.has(detailedMovie.tmdbId.toString())}
          isDisliked={localDislikedIds.has(detailedMovie.tmdbId.toString())}
          isFavorited={localFavoriteIds.has(detailedMovie.tmdbId.toString())}
          userRating={localWatchedRatings.get(detailedMovie.tmdbId.toString())}
        />
      )}
    </>
  );
};

export default MovieCarousel;
