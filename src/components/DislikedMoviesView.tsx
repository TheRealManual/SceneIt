import React, { useState, useMemo, useEffect } from 'react';
import './DislikedMoviesView.css';
import StarRating from './StarRating';
import RatingModal from './RatingModal';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  overview: string;
  genres?: Array<{ id: number; name: string }>;
  voteAverage?: number;
  ageRating?: string;
  runtime?: number;
  keywords?: string[];
  language?: string;
  director?: string;
  cast?: Array<{ name: string; character: string; profilePath?: string }>;
  userRating?: number;
  averageRating?: number;
  ratingCount?: number;
}

interface DislikedMoviesViewProps {
  movies: Movie[];
  onMoveToLiked: (movieId: string, title: string, posterPath: string) => void;
  onBackToHome?: () => void;
  onKeepSearching?: () => void;
  showSessionActions?: boolean; // Show "Start New Search" and "Keep Searching" buttons
  showFilters?: boolean; // Show filter sidebar (default: false)
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, newRating: number) => void;
  showWatchedMovies?: 'all' | 'watched' | 'unwatched';
  onToggleShowWatched?: (filter: 'all' | 'watched' | 'unwatched') => void;
}

const DislikedMoviesView: React.FC<DislikedMoviesViewProps> = ({
  movies,
  onMoveToLiked,
  onBackToHome,
  onKeepSearching,
  showSessionActions = false,
  showFilters = false,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  showWatchedMovies = 'all',
  onToggleShowWatched
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [watchedMovies, setWatchedMovies] = useState<Map<string, number>>(new Map());
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingMovieId, setRatingMovieId] = useState<string | null>(null);
  const [ratingMovieTitle, setRatingMovieTitle] = useState<string>('');
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [hoveredWatchedButton, setHoveredWatchedButton] = useState<string | null>(null);

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
          const watchedMap = new Map<string, number>();
          // Handle the correct response format: { watchedMovies: [...] }
          if (data.watchedMovies && Array.isArray(data.watchedMovies)) {
            data.watchedMovies.forEach((item: { tmdbId: number; userRating: number }) => {
              watchedMap.set(item.tmdbId.toString(), item.userRating);
            });
          }
          setWatchedMovies(watchedMap);
        }
      } catch (error) {
        console.error('Failed to fetch watched movies:', error);
      }
    };

    fetchWatchedMovies();
  }, []);

  const handleWatchClick = (movie: Movie) => {
    const movieId = movie.tmdbId.toString();
    const existingRating = watchedMovies.get(movieId);
    setRatingMovieId(movieId);
    setRatingMovieTitle(movie.title);
    setCurrentRating(existingRating || 0);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (rating: number) => {
    if (!ratingMovieId) return;

    const movieToWatch = movies.find(m => m.tmdbId.toString() === ratingMovieId);
    if (!movieToWatch) return;

    if (watchedMovies.has(ratingMovieId)) {
      // Update existing rating
      onUpdateWatchedRating?.(ratingMovieId, rating);
      setWatchedMovies(prev => {
        const newMap = new Map(prev);
        newMap.set(ratingMovieId, rating);
        return newMap;
      });
    } else {
      // Mark as watched with rating
      onWatch?.(movieToWatch, rating);
      setWatchedMovies(prev => {
        const newMap = new Map(prev);
        newMap.set(ratingMovieId, rating);
        return newMap;
      });
    }

    setShowRatingModal(false);
    setRatingMovieId(null);
    setRatingMovieTitle('');
    setCurrentRating(0);
  };

  const handleUnwatchClick = (movieId: string) => {
    onUnwatch?.(movieId);
    setWatchedMovies(prev => {
      const newMap = new Map(prev);
      newMap.delete(movieId);
      return newMap;
    });
  };
  
  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number] | null>(null);
  const [selectedRatingRange, setSelectedRatingRange] = useState<[number, number] | null>(null);
  const [selectedAgeRatings, setSelectedAgeRatings] = useState<Set<string>>(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedDirectors, setSelectedDirectors] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('title');
  
  // Extract available filters from movies
  const availableFilters = useMemo(() => {
    const genres = new Set<string>();
    const years = new Set<number>();
    const ageRatings = new Set<string>();
    const keywords = new Set<string>();
    const languages = new Set<string>();
    const directors = new Set<string>();
    let minRating = 10;
    let maxRating = 0;
    
    movies.forEach(movie => {
      // Genres
      movie.genres?.forEach(g => genres.add(g.name));
      
      // Years
      if (movie.releaseDate) {
        const year = new Date(movie.releaseDate).getFullYear();
        if (!isNaN(year) && isFinite(year) && year > 1800 && year < 2100) {
          years.add(year);
        }
      }
      
      // Ratings
      if (movie.voteAverage) {
        minRating = Math.min(minRating, movie.voteAverage);
        maxRating = Math.max(maxRating, movie.voteAverage);
      }
      
      // Age ratings
      if (movie.ageRating) ageRatings.add(movie.ageRating);
      
      // Keywords
      movie.keywords?.forEach(kw => keywords.add(kw));
      
      // Languages
      if (movie.language) languages.add(movie.language);
      
      // Directors
      if (movie.director) directors.add(movie.director);
    });
    
    // Ensure ratingRange is valid
    const validRatingRange = minRating <= maxRating 
      ? [Math.floor(minRating), Math.ceil(maxRating)] as [number, number]
      : [0, 10] as [number, number];
    
    return {
      genres: Array.from(genres).sort(),
      years: Array.from(years).sort((a, b) => b - a).filter(y => !isNaN(y) && isFinite(y)),
      ageRatings: Array.from(ageRatings).sort().filter(r => r && r !== 'NaN'),
      keywords: Array.from(keywords).sort().filter(k => k && k !== 'NaN'),
      languages: Array.from(languages).sort().filter(l => l && l !== 'NaN'),
      directors: Array.from(directors).sort().filter(d => d && d !== 'NaN'),
      ratingRange: validRatingRange
    };
  }, [movies]);
  
  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    // Don't filter out movies - we'll handle NaN keys differently in rendering
    if (!showFilters) return movies;
    
    let filtered = [...movies];
    
    // Apply genre filter
    if (selectedGenres.size > 0) {
      filtered = filtered.filter(movie => 
        movie.genres?.some(g => selectedGenres.has(g.name))
      );
    }
    
    // Apply year range filter
    if (selectedYearRange) {
      filtered = filtered.filter(movie => {
        if (!movie.releaseDate) return false;
        const year = new Date(movie.releaseDate).getFullYear();
        return year >= selectedYearRange[0] && year <= selectedYearRange[1];
      });
    }
    
    // Apply rating range filter
    if (selectedRatingRange) {
      filtered = filtered.filter(movie => {
        if (!movie.voteAverage) return false;
        return movie.voteAverage >= selectedRatingRange[0] && movie.voteAverage <= selectedRatingRange[1];
      });
    }
    
    // Apply age rating filter
    if (selectedAgeRatings.size > 0) {
      filtered = filtered.filter(movie => 
        movie.ageRating && selectedAgeRatings.has(movie.ageRating)
      );
    }
    
    // Apply keyword filter
    if (selectedKeywords.size > 0) {
      filtered = filtered.filter(movie => 
        movie.keywords?.some(kw => selectedKeywords.has(kw))
      );
    }
    
    // Apply language filter
    if (selectedLanguages.size > 0) {
      filtered = filtered.filter(movie => 
        movie.language && selectedLanguages.has(movie.language)
      );
    }
    
    // Apply director filter
    if (selectedDirectors.size > 0) {
      filtered = filtered.filter(movie => 
        movie.director && selectedDirectors.has(movie.director)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year-desc':
          return (new Date(b.releaseDate || 0).getFullYear()) - (new Date(a.releaseDate || 0).getFullYear());
        case 'year-asc':
          return (new Date(a.releaseDate || 0).getFullYear()) - (new Date(b.releaseDate || 0).getFullYear());
        case 'rating-desc':
          return (b.voteAverage || 0) - (a.voteAverage || 0);
        case 'rating-asc':
          return (a.voteAverage || 0) - (b.voteAverage || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [showFilters, movies, selectedGenres, selectedYearRange, selectedRatingRange, selectedAgeRatings, selectedKeywords, selectedLanguages, selectedDirectors, sortBy]);
  
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };
  
  const toggleAgeRating = (rating: string) => {
    setSelectedAgeRatings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rating)) {
        newSet.delete(rating);
      } else {
        newSet.add(rating);
      }
      return newSet;
    });
  };
  
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };
  
  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(language)) {
        newSet.delete(language);
      } else {
        newSet.add(language);
      }
      return newSet;
    });
  };
  
  const toggleDirector = (director: string) => {
    setSelectedDirectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(director)) {
        newSet.delete(director);
      } else {
        newSet.add(director);
      }
      return newSet;
    });
  };
  
  const clearFilters = () => {
    setSelectedGenres(new Set());
    setSelectedYearRange(null);
    setSelectedRatingRange(null);
    setSelectedAgeRatings(new Set());
    setSelectedKeywords(new Set());
    setSelectedLanguages(new Set());
    setSelectedDirectors(new Set());
    setSortBy('title');
  };

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
      {/* Filter Sidebar - only show if showFilters is true */}
      {showFilters && (
      <div className="filter-sidebar">
        <div className="filter-header">
          <h3>Filters</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>Clear All</button>
        </div>
        
        {/* Sort */}
        <div className="filter-section">
          <h4>Sort By</h4>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="title">Title (A-Z)</option>
            <option value="year-desc">Year (Newest)</option>
            <option value="year-asc">Year (Oldest)</option>
            <option value="rating-desc">Rating (Highest)</option>
            <option value="rating-asc">Rating (Lowest)</option>
          </select>
        </div>

        {/* Show Watched Movies Toggle */}
        {onToggleShowWatched && (
          <div className="filter-section">
            <h4>Filter by Watch Status</h4>
            <div style={{
              display: 'flex',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '4px',
              borderRadius: '8px'
            }}>
              <button
                onClick={() => onToggleShowWatched('watched')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: showWatchedMovies === 'watched' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: showWatchedMovies === 'watched' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                Watched
              </button>
              <button
                onClick={() => onToggleShowWatched('all')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: showWatchedMovies === 'all' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: showWatchedMovies === 'all' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                All
              </button>
              <button
                onClick={() => onToggleShowWatched('unwatched')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: showWatchedMovies === 'unwatched' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: showWatchedMovies === 'unwatched' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                Unwatched
              </button>
            </div>
          </div>
        )}
        
        {/* Genres */}
        {availableFilters.genres.length > 0 && (
          <div className="filter-section">
            <h4>Genres</h4>
            <div className="filter-options">
              {availableFilters.genres.map(genre => (
                <label key={genre} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedGenres.has(genre)}
                    onChange={() => toggleGenre(genre)}
                  />
                  <span>{genre}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Year Range */}
        {availableFilters.years.length > 1 && (
          <div className="filter-section">
            <h4>Release Year</h4>
            <div className="year-range-inputs">
              <input
                type="number"
                placeholder="From"
                min={availableFilters.years[availableFilters.years.length - 1]}
                max={availableFilters.years[0]}
                value={selectedYearRange?.[0] ?? ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && isFinite(val)) {
                    setSelectedYearRange(prev => [val, prev?.[1] ?? availableFilters.years[0]]);
                  } else if (e.target.value === '') {
                    setSelectedYearRange(null);
                  }
                }}
                className="year-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="To"
                min={availableFilters.years[availableFilters.years.length - 1]}
                max={availableFilters.years[0]}
                value={selectedYearRange?.[1] ?? ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && isFinite(val)) {
                    setSelectedYearRange(prev => [prev?.[0] ?? availableFilters.years[availableFilters.years.length - 1], val]);
                  } else if (e.target.value === '') {
                    setSelectedYearRange(null);
                  }
                }}
                className="year-input"
              />
            </div>
          </div>
        )}
        
        {/* Rating Range */}
        {availableFilters.ratingRange && availableFilters.ratingRange[0] < availableFilters.ratingRange[1] && (
          <div className="filter-section">
            <h4>Rating</h4>
            <div className="rating-range-inputs">
              <input
                type="number"
                step="0.1"
                min={availableFilters.ratingRange[0]}
                max={availableFilters.ratingRange[1]}
                placeholder="Min"
                value={selectedRatingRange?.[0] || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setSelectedRatingRange(prev => [val, prev?.[1] || availableFilters.ratingRange[1]]);
                  } else {
                    setSelectedRatingRange(null);
                  }
                }}
                className="rating-input"
              />
              <span>-</span>
              <input
                type="number"
                step="0.1"
                min={availableFilters.ratingRange[0]}
                max={availableFilters.ratingRange[1]}
                placeholder="Max"
                value={selectedRatingRange?.[1] || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setSelectedRatingRange(prev => [prev?.[0] || availableFilters.ratingRange[0], val]);
                  } else {
                    setSelectedRatingRange(null);
                  }
                }}
                className="rating-input"
              />
            </div>
          </div>
        )}
        
        {/* Age Ratings */}
        {availableFilters.ageRatings.length > 0 && (
          <div className="filter-section">
            <h4>Age Rating</h4>
            <div className="filter-options">
              {availableFilters.ageRatings.map(rating => (
                <label key={rating} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedAgeRatings.has(rating)}
                    onChange={() => toggleAgeRating(rating)}
                  />
                  <span>{rating}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Keywords */}
        {availableFilters.keywords.length > 0 && (
          <div className="filter-section">
            <h4>Keywords</h4>
            <div className="filter-options">
              {availableFilters.keywords.slice(0, 20).map(keyword => (
                <label key={keyword} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedKeywords.has(keyword)}
                    onChange={() => toggleKeyword(keyword)}
                  />
                  <span>{keyword}</span>
                </label>
              ))}
              {availableFilters.keywords.length > 20 && (
                <p className="filter-note">Showing top 20 keywords</p>
              )}
            </div>
          </div>
        )}
        
        {/* Languages */}
        {availableFilters.languages.length > 0 && (
          <div className="filter-section">
            <h4>Language</h4>
            <div className="filter-options">
              {availableFilters.languages.map(language => (
                <label key={language} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.has(language)}
                    onChange={() => toggleLanguage(language)}
                  />
                  <span>{language}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Directors */}
        {availableFilters.directors.length > 0 && (
          <div className="filter-section">
            <h4>Director</h4>
            <div className="filter-options">
              {availableFilters.directors.map(director => (
                <label key={director} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDirectors.has(director)}
                    onChange={() => toggleDirector(director)}
                  />
                  <span>{director}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
      
      <div className="disliked-movies-content">
        <div className="disliked-movies-header">
          <h1 className="disliked-movies-title">Movies You Disliked</h1>
          <p className="disliked-movies-count">{filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}</p>
        </div>

      <div className="disliked-movies-grid">
        {filteredMovies.map((movie, index) => {
          const movieId = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId.toString() : `disliked-${index}-${movie.title}`;
          const isProcessing = processingIds.has(movieId);
          const safeKey = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId : `disliked-${index}-${movie.title}`;
          const userRating = watchedMovies.get(movieId);
          const isWatched = !!userRating;
          const averageRating = movie.averageRating || 0;
          
          return (
            <div key={safeKey} className="movie-card">
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
                <button
                  className={`watched-movie-button ${isWatched ? 'watched' : ''}`}
                  onClick={() => isWatched ? handleUnwatchClick(movieId) : handleWatchClick(movie)}
                  onMouseEnter={() => setHoveredWatchedButton(movieId)}
                  onMouseLeave={() => setHoveredWatchedButton(null)}
                  title={isWatched ? 'Unwatch movie' : 'Mark as watched'}
                >
                  <span className="watched-icon">🎬</span>
                  <div className={`rating-wrapper ${isWatched || (hoveredWatchedButton === movieId && averageRating > 0) ? 'show' : ''}`}>
                    {isWatched ? (
                      <StarRating rating={userRating} size="small" />
                    ) : hoveredWatchedButton === movieId && averageRating > 0 ? (
                      <StarRating rating={averageRating} size="small" />
                    ) : null}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showSessionActions && onBackToHome && onKeepSearching && (
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
      )}
      </div>

      {showRatingModal && (
        <RatingModal
          movieTitle={ratingMovieTitle}
          initialRating={currentRating}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
};

export default DislikedMoviesView;
