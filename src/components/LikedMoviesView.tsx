import React, { useState, useMemo } from 'react';
import './LikedMoviesView.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  overview?: string;
  genres?: Array<{ id: number; name: string }>;
  voteAverage?: number;
  ageRating?: string;
  runtime?: number;
  keywords?: string[];
  language?: string;
  director?: string;
  cast?: Array<{ name: string; character: string; profilePath?: string }>;
}

interface LikedMoviesViewProps {
  movies: Movie[];
  favoriteMovies: Movie[];
  dislikedMovies?: Movie[];
  onAddToFavorites: (movieId: string, title: string, posterPath: string) => void;
  onRemoveFromFavorites: (movieId: string) => void;
  onMoveToDisliked: (movieId: string, title: string, posterPath: string) => void;
  onMoveToLiked?: (movieId: string, title: string, posterPath: string) => void;
  onBackToHome?: () => void;
  onKeepSearching?: () => void;
  favoriteMovieIds: Set<string>;
  showSessionActions?: boolean; // Show "Start New Search" and "Keep Searching" buttons
  showFilters?: boolean; // Show filter sidebar (default: false)
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
  favoriteMovieIds,
  showSessionActions = false,
  showFilters = false
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());
  
  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number] | null>(null);
  const [selectedRatingRange, setSelectedRatingRange] = useState<[number, number] | null>(null);
  const [selectedAgeRatings, setSelectedAgeRatings] = useState<Set<string>>(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedDirectors, setSelectedDirectors] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('title');
  
  // Extract available filters from all movies (liked + favorites)
  const allMoviesForFiltering = useMemo(() => {
    const combined = [...movies, ...favoriteMovies];
    const unique = Array.from(new Map(combined.map(m => [m.tmdbId, m])).values());
    return unique;
  }, [movies, favoriteMovies]);
  
  const availableFilters = useMemo(() => {
    const genres = new Set<string>();
    const years = new Set<number>();
    const ageRatings = new Set<string>();
    const keywords = new Set<string>();
    const languages = new Set<string>();
    const directors = new Set<string>();
    let minRating = 10;
    let maxRating = 0;
    
    console.log('=== FRONTEND FILTER DEBUG ===');
    console.log('Total movies for filtering:', allMoviesForFiltering.length);
    if (allMoviesForFiltering.length > 0) {
      const firstMovie = allMoviesForFiltering[0];
      console.log('Sample movie data:', {
        title: firstMovie.title,
        hasKeywords: !!firstMovie.keywords && firstMovie.keywords.length > 0,
        keywords: firstMovie.keywords,
        hasLanguage: !!firstMovie.language,
        language: firstMovie.language,
        hasDirector: !!firstMovie.director,
        director: firstMovie.director,
        hasCast: !!firstMovie.cast && firstMovie.cast.length > 0,
        castCount: firstMovie.cast?.length || 0
      });
    }
    
    allMoviesForFiltering.forEach(movie => {
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
    
    console.log('Available filters extracted:', {
      genresCount: genres.size,
      keywordsCount: keywords.size,
      languagesCount: languages.size,
      directorsCount: directors.size
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
  }, [allMoviesForFiltering]);
  
  // Filter and sort movies
  const filterAndSortMovies = (moviesToFilter: Movie[]) => {
    let filtered = [...moviesToFilter];
    
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
  };
  
  const filteredMovies = useMemo(() => {
    // Don't filter out movies - we'll handle NaN keys differently in rendering
    return showFilters ? filterAndSortMovies(movies) : movies;
  }, [showFilters, movies, selectedGenres, selectedYearRange, selectedRatingRange, selectedAgeRatings, selectedKeywords, selectedLanguages, selectedDirectors, sortBy]);
  
  const filteredFavorites = useMemo(() => {
    // Don't filter out movies - we'll handle NaN keys differently in rendering
    return showFilters ? filterAndSortMovies(favoriteMovies) : favoriteMovies;
  }, [showFilters, favoriteMovies, selectedGenres, selectedYearRange, selectedRatingRange, selectedAgeRatings, selectedKeywords, selectedLanguages, selectedDirectors, sortBy]);
  
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
      
      <div className="liked-movies-content">
        
        {/* Favorited Movies Section */}
        {filteredFavorites.length > 0 && (
          <div className="favorites-section">
            <div className="section-header">
              <h2 className="section-title">⭐ Your Favorite Movies</h2>
              <p className="section-count">{filteredFavorites.length} {filteredFavorites.length === 1 ? 'favorite' : 'favorites'}</p>
            </div>

            <div className="liked-movies-grid">
              {filteredFavorites.map((movie, index) => {
                const movieId = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId.toString() : `fav-${index}-${movie.title}`;
                const isProcessing = processingIds.has(movieId);
                const isMoving = movingIds.has(movieId);
                const safeKey = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId : `fav-${index}-${movie.title}`;
                
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
            <p className="section-count">{filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}</p>
          </div>

      <div className="liked-movies-grid">
        {filteredMovies.map((movie, index) => {
          const movieId = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId.toString() : `movie-${index}-${movie.title}`;
          const isFavorite = favoriteMovieIds.has(movieId);
          const isProcessing = processingIds.has(movieId);
          const isMoving = movingIds.has(movieId);
          const safeKey = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId : `movie-${index}-${movie.title}`;
          
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
              {dislikedMovies.map((movie, index) => {
                const movieId = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId.toString() : `disliked-${index}-${movie.title}`;
                const isMoving = movingIds.has(movieId);
                const safeKey = (movie.tmdbId && !isNaN(movie.tmdbId)) ? movie.tmdbId : `disliked-${index}-${movie.title}`;
                
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

      {showSessionActions && onBackToHome && onKeepSearching && (
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
      )}
      </div>
    </div>
  );
};

export default LikedMoviesView;
