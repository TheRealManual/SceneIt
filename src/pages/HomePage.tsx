import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';
import { userService } from '../services/user.service';
import { movieCacheService } from '../services/movieCache.service';
import MovieCarousel from '../components/MovieCarousel';

interface MoviePreferences {
  description: string;
  releaseYear: [number, number];
  runtime: [number, number];
  imdbRating: [number, number];
  ageRating: string;
  moodIntensity: number;
  humorLevel: number;
  violenceLevel: number;
  romanceLevel: number;
  complexityLevel: number;
  genres: { [key: string]: number };
  language: string;
}

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

interface HomePageProps {
  user: User | null;
  preferences: MoviePreferences;
  setPreferences: React.Dispatch<React.SetStateAction<MoviePreferences>>;
  preferencesLoaded: boolean;
  onShowAuthPrompt: () => void;
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, rating: number) => void;
  likedMovieIds?: Set<string>;
  dislikedMovieIds?: Set<string>;
  favoriteMovieIds?: Set<string>;
}

const HomePage: React.FC<HomePageProps> = ({ 
  user, 
  preferences, 
  setPreferences, 
  preferencesLoaded, 
  onShowAuthPrompt,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  likedMovieIds,
  dislikedMovieIds,
  favoriteMovieIds
}) => {
  const navigate = useNavigate();
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadAbortController = useRef<AbortController | null>(null);

  const handleClearPreferences = () => {
    setPreferences({
      description: '',
      releaseYear: [1950, 2025],
      runtime: [60, 180],
      imdbRating: [1, 10],
      ageRating: 'Any',
      moodIntensity: 5,
      humorLevel: 5,
      violenceLevel: 5,
      romanceLevel: 5,
      complexityLevel: 5,
      genres: {
        'Action': 5,
        'Comedy': 5,
        'Drama': 5,
        'Horror': 5,
        'Romance': 5,
        'Thriller': 5,
        'Sci-Fi': 5,
        'Fantasy': 5,
        'Animation': 5,
        'Documentary': 5
      },
      language: 'English'
    });
  };

  const handleSubmitPreferences = async () => {
    // Check if user is authenticated
    if (!user) {
      onShowAuthPrompt();
      return;
    }

    // Save preferences before searching
    if (user && preferencesLoaded) {
      try {
        await userService.updatePreferences({
          description: preferences.description,
          yearRange: preferences.releaseYear,
          runtimeRange: preferences.runtime,
          ratingRange: preferences.imdbRating,
          ageRating: preferences.ageRating,
          moodIntensity: preferences.moodIntensity,
          humorLevel: preferences.humorLevel,
          violenceLevel: preferences.violenceLevel,
          romanceLevel: preferences.romanceLevel,
          complexityLevel: preferences.complexityLevel,
          genres: preferences.genres,
          language: preferences.language
        });
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
    
    // Navigate to search with preferences
    navigate('/search', { state: { preferences } });
  };

  const handleSubmitPreferencesDev = async () => {
    // Check if user is authenticated
    if (!user) {
      onShowAuthPrompt();
      return;
    }

    // Save preferences before searching
    if (user && preferencesLoaded) {
      try {
        await userService.updatePreferences({
          description: preferences.description,
          yearRange: preferences.releaseYear,
          runtimeRange: preferences.runtime,
          ratingRange: preferences.imdbRating,
          ageRating: preferences.ageRating,
          moodIntensity: preferences.moodIntensity,
          humorLevel: preferences.humorLevel,
          violenceLevel: preferences.violenceLevel,
          romanceLevel: preferences.romanceLevel,
          complexityLevel: preferences.complexityLevel,
          genres: preferences.genres,
          language: preferences.language
        });
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
    
    // Navigate to search with dev mode preferences
    navigate('/search', { state: { preferences, devMode: true } });
  };

  // Preload movies on hover
  const handlePreloadHover = async (devMode: boolean = false) => {
    if (!user || isPreloading) return;

    // Cancel any previous preload
    if (preloadAbortController.current) {
      preloadAbortController.current.abort();
    }

    setIsPreloading(true);
    preloadAbortController.current = new AbortController();

    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      if (devMode) {
        // Preload carousel movies for loading screen
        console.log('🚀 Preloading carousel movies and posters...');
        const response = await fetch(`${backendUrl}/api/movies/random?count=20`, {
          credentials: 'include',
          signal: preloadAbortController.current.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.movies && data.movies.length > 0) {
            // Cache the carousel movies
            const cacheKey = 'loading-carousel-movies';
            console.log('💾 Caching carousel with key:', cacheKey);
            console.log('� Preloaded Carousel Movie IDs:', data.movies.map((m: any) => `${m.tmdbId} (${m.title})`));
            movieCacheService.setCachedMovies(cacheKey, data.movies);
            
            // Preload poster images
            console.log(`📸 Preloading ${data.movies.length} carousel posters...`);
            await movieCacheService.preloadImages(data.movies);
            console.log('✅ All carousel movies and posters cached!');
          }
        }
      } else {
        // Preload AI search
        console.log('🚀 Preloading AI search and posters...');
        const searchPayload = {
          description: preferences.description,
          yearRange: preferences.releaseYear,
          runtimeRange: preferences.runtime,
          ratingRange: preferences.imdbRating,
          ageRating: preferences.ageRating,
          moodIntensity: preferences.moodIntensity,
          humorLevel: preferences.humorLevel,
          violenceLevel: preferences.violenceLevel,
          romanceLevel: preferences.romanceLevel,
          complexityLevel: preferences.complexityLevel,
          genres: preferences.genres,
          language: preferences.language
        };
        
        const response = await fetch(`${backendUrl}/api/movies/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(searchPayload),
          signal: preloadAbortController.current.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.movies && data.movies.length > 0) {
            // Cache the movies
            const cacheKey = movieCacheService.generateSearchCacheKey(preferences, false);
            movieCacheService.setCachedMovies(cacheKey, data.movies);
            
            // Preload poster images
            console.log(`📸 Preloading ${data.movies.length} movie posters...`);
            await movieCacheService.preloadImages(data.movies);
            console.log('✅ All movies and posters cached!');
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.log('Preload error (will load normally):', error);
      }
    } finally {
      setIsPreloading(false);
    }
  };

  const handlePreloadCancel = () => {
    if (preloadAbortController.current) {
      preloadAbortController.current.abort();
      setIsPreloading(false);
    }
  };

  const handleLikeMovie = async (movie: Movie) => {
    if (!user) {
      onShowAuthPrompt();
      return;
    }

    // Validate movieId before sending
    if (!movie.tmdbId || isNaN(movie.tmdbId) || !isFinite(movie.tmdbId)) {
      console.error('❌ Invalid movie ID:', movie.tmdbId);
      return;
    }

    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          movieId: movie.tmdbId.toString()
        })
      });

      if (response.ok) {
        console.log('✅ Movie liked:', movie.title);
      } else {
        console.error('❌ Failed to like movie');
      }
    } catch (error) {
      console.error('Error saving liked movie:', error);
    }
  };

  const handleDislikeMovie = async (movie: Movie) => {
    if (!user) {
      onShowAuthPrompt();
      return;
    }

    // Validate movieId before sending
    if (!movie.tmdbId || isNaN(movie.tmdbId) || !isFinite(movie.tmdbId)) {
      console.error('❌ Invalid movie ID:', movie.tmdbId);
      return;
    }

    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          movieId: movie.tmdbId.toString()
        })
      });

      if (response.ok) {
        console.log('✅ Movie disliked:', movie.title);
      } else {
        console.error('❌ Failed to dislike movie');
      }
    } catch (error) {
      console.error('Error saving disliked movie:', error);
    }
  };

  const handleFavoriteMovie = async (movie: Movie) => {
    if (!user) {
      onShowAuthPrompt();
      return;
    }

    // Validate movieId before sending
    if (!movie.tmdbId || isNaN(movie.tmdbId) || !isFinite(movie.tmdbId)) {
      console.error('❌ Invalid movie ID:', movie.tmdbId);
      return;
    }

    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          movieId: movie.tmdbId.toString(),
          title: movie.title,
          posterPath: movie.posterPath
        })
      });

      if (response.ok) {
        console.log('✅ Movie added to favorites:', movie.title);
      } else {
        console.error('❌ Failed to add to favorites');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  return (
    <main className="preferences-container">
      {/* Movie Carousel */}
      <MovieCarousel 
        onLike={handleLikeMovie}
        onDislike={handleDislikeMovie}
        onFavorite={handleFavoriteMovie}
        onWatch={onWatch}
        onUnwatch={onUnwatch}
        onUpdateWatchedRating={onUpdateWatchedRating}
        likedMovieIds={likedMovieIds}
        dislikedMovieIds={dislikedMovieIds}
        favoriteMovieIds={favoriteMovieIds}
      />
      
      <div className="preferences-form">
        <h2>Tell Us What You're Looking For</h2>
        
        {/* Movie Description */}
        <div className="form-section">
          <label htmlFor="description">Describe Your Ideal Movie</label>
          <textarea
            id="description"
            value={preferences.description}
            onChange={(e) => {
              setPreferences(prev => ({ ...prev, description: e.target.value }));
              e.target.style.height = 'auto';
              e.target.style.height = Math.max(120, e.target.scrollHeight) + 'px';
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.max(120, target.scrollHeight) + 'px';
            }}
            placeholder="Tell us in detail what kind of movie you want to watch. Include themes, plot elements, mood, or anything specific you're looking for..."
            className="movie-description"
            rows={4}
          />
        </div>

        {/* Basic Movie Properties */}
        <div className="form-section">
          <h3>Movie Details</h3>
          <div className="sliders-grid">
            <div className="slider-group">
              <label>Release Year: {preferences.releaseYear[0]} - {preferences.releaseYear[1]}</label>
              <div className="range-slider-container">
                <input
                  type="range"
                  min="1900"
                  max="2025"
                  value={preferences.releaseYear[0]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    releaseYear: [parseInt(e.target.value), prev.releaseYear[1]] 
                  }))}
                  className="range-slider"
                />
                <input
                  type="range"
                  min="1900"
                  max="2025"
                  value={preferences.releaseYear[1]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    releaseYear: [prev.releaseYear[0], parseInt(e.target.value)] 
                  }))}
                  className="range-slider"
                />
              </div>
            </div>

            <div className="slider-group">
              <label>Runtime: {preferences.runtime[0]} - {preferences.runtime[1]} minutes</label>
              <div className="range-slider-container">
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={preferences.runtime[0]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    runtime: [parseInt(e.target.value), prev.runtime[1]] 
                  }))}
                  className="range-slider"
                />
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={preferences.runtime[1]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    runtime: [prev.runtime[0], parseInt(e.target.value)] 
                  }))}
                  className="range-slider"
                />
              </div>
            </div>

            <div className="slider-group">
              <label>IMDb Rating: {preferences.imdbRating[0]} - {preferences.imdbRating[1]}</label>
              <div className="range-slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={preferences.imdbRating[0]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    imdbRating: [parseFloat(e.target.value), prev.imdbRating[1]] 
                  }))}
                  className="range-slider"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={preferences.imdbRating[1]}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    imdbRating: [prev.imdbRating[0], parseFloat(e.target.value)] 
                  }))}
                  className="range-slider"
                />
              </div>
            </div>

            <div className="slider-group">
              <label htmlFor="ageRating">Age Rating</label>
              <select
                id="ageRating"
                value={preferences.ageRating}
                onChange={(e) => setPreferences(prev => ({ ...prev, ageRating: e.target.value }))}
                className="dropdown"
              >
                <option value="Any">Any Rating</option>
                <option value="G">G - General Audiences</option>
                <option value="PG">PG - Parental Guidance</option>
                <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                <option value="R">R - Restricted</option>
                <option value="NC-17">NC-17 - Adults Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content & Mood Levels */}
        <div className="form-section">
          <h3>Content & Mood</h3>
          <div className="sliders-grid">
            <div className="slider-group">
              <label>Mood Intensity: {preferences.moodIntensity}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.moodIntensity}
                onChange={(e) => setPreferences(prev => ({ ...prev, moodIntensity: parseInt(e.target.value) }))}
                className="range-slider single"
              />
            </div>

            <div className="slider-group">
              <label>Humor Level: {preferences.humorLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.humorLevel}
                onChange={(e) => setPreferences(prev => ({ ...prev, humorLevel: parseInt(e.target.value) }))}
                className="range-slider single"
              />
            </div>

            <div className="slider-group">
              <label>Violence Level: {preferences.violenceLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.violenceLevel}
                onChange={(e) => setPreferences(prev => ({ ...prev, violenceLevel: parseInt(e.target.value) }))}
                className="range-slider single"
              />
            </div>

            <div className="slider-group">
              <label>Romance Level: {preferences.romanceLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.romanceLevel}
                onChange={(e) => setPreferences(prev => ({ ...prev, romanceLevel: parseInt(e.target.value) }))}
                className="range-slider single"
              />
            </div>

            <div className="slider-group">
              <label>Complexity Level: {preferences.complexityLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.complexityLevel}
                onChange={(e) => setPreferences(prev => ({ ...prev, complexityLevel: parseInt(e.target.value) }))}
                className="range-slider single"
              />
            </div>
          </div>
        </div>

        {/* Genre Preferences */}
        <div className="form-section">
          <h3>Genre Preferences</h3>
          <div className="genre-grid">
            {Object.entries(preferences.genres).map(([genre, value]) => (
              <div key={genre} className="slider-group">
                <label>{genre}: {value}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={value}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    genres: { ...prev.genres, [genre]: parseInt(e.target.value) }
                  }))}
                  className="range-slider single"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="form-section">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            value={preferences.language}
            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
            className="dropdown"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Mandarin">Mandarin</option>
            <option value="Hindi">Hindi</option>
            <option value="Any">Any Language</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button onClick={handleClearPreferences} className="clear-button">
            Clear All
          </button>
          <button 
            onClick={handleSubmitPreferencesDev} 
            onMouseEnter={() => handlePreloadHover(true)}
            onMouseLeave={handlePreloadCancel}
            className="dev-button"
          >
            Find My Movies (Dev)
          </button>
          <button 
            onClick={handleSubmitPreferences} 
            onMouseEnter={() => handlePreloadHover(false)}
            onMouseLeave={handlePreloadCancel}
            className="submit-button"
          >
            Find My Movies
          </button>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
