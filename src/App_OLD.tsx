import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import ProfileModal from './components/ProfileModal'
import LoadingScreen from './components/LoadingScreen'
import AuthPromptModal from './components/AuthPromptModal'
import MovieSwiper from './components/MovieSwiper'
import LikedMoviesView from './components/LikedMoviesView'
import DislikedMoviesView from './components/DislikedMoviesView'
import { authService } from './services/auth.service'
import { userService } from './services/user.service'
import { User } from './types/user'

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

interface BackendStatus {
  connected: boolean;
  message: string;
  loading: boolean;
}

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

type ViewState = 'preferences' | 'loading' | 'results' | 'liked-summary' | 'liked-movies-page' | 'disliked-movies-page';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('preferences');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<Set<string>>(new Set());
  
  // Session-specific likes/dislikes (only for current swipe session)
  const [sessionLikedMovies, setSessionLikedMovies] = useState<Movie[]>([]);
  const [sessionDislikedMovies, setSessionDislikedMovies] = useState<Movie[]>([]);
  
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    connected: false,
    message: 'Checking connection...',
    loading: true
  });

  const [preferences, setPreferences] = useState<MoviePreferences>({
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

  const checkBackendConnection = async () => {
    try {
      setBackendStatus(prev => ({ ...prev, loading: true, message: 'Connecting...' }));
      
      // Use Vite environment variables
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const isDev = import.meta.env.DEV;
      const envMode = isDev ? 'Development' : 'Production';
      
      console.log(`Checking backend connection (${envMode} mode):`, backendUrl);
      
      const response = await fetch(`${backendUrl}/api/status`);
      
      if (response.ok) {
        const data = await response.json();
        setBackendStatus({
          connected: true,
          message: `Connected to ${envMode} backend!`,
          loading: false
        });
        console.log('Backend connected:', data);
      } else {
        throw new Error('Backend response not ok');
      }
    } catch (error) {
      const isDev = import.meta.env.DEV;
      const envMode = isDev ? 'Development' : 'Production';
      console.error(`Failed to connect to ${envMode} backend:`, error);
      setBackendStatus({
        connected: false,
        message: `Unable to connect to ${envMode} backend`,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkBackendConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      // Load user preferences from backend if logged in
      if (currentUser) {
        try {
          const userProfile = await userService.getProfile();
          if (userProfile && userProfile.preferences) {
            console.log('Loading saved preferences:', userProfile.preferences);
            
            // Map backend preferences to frontend format
            const loadedPreferences: Partial<MoviePreferences> = {};
            const prefs = userProfile.preferences;
            
            // Load all scalar preferences
            if (prefs.description) loadedPreferences.description = prefs.description;
            if (prefs.ageRating) loadedPreferences.ageRating = prefs.ageRating;
            if (prefs.language) loadedPreferences.language = prefs.language;
            
            // Load numeric preferences
            if (prefs.moodIntensity !== undefined) loadedPreferences.moodIntensity = prefs.moodIntensity;
            if (prefs.humorLevel !== undefined) loadedPreferences.humorLevel = prefs.humorLevel;
            if (prefs.violenceLevel !== undefined) loadedPreferences.violenceLevel = prefs.violenceLevel;
            if (prefs.romanceLevel !== undefined) loadedPreferences.romanceLevel = prefs.romanceLevel;
            if (prefs.complexityLevel !== undefined) loadedPreferences.complexityLevel = prefs.complexityLevel;
            
            // Load ranges
            if (prefs.yearRange && prefs.yearRange.length === 2) {
              loadedPreferences.releaseYear = prefs.yearRange as [number, number];
            }
            if (prefs.runtimeRange && prefs.runtimeRange.length === 2) {
              loadedPreferences.runtime = prefs.runtimeRange as [number, number];
            }
            if (prefs.ratingRange && prefs.ratingRange.length === 2) {
              loadedPreferences.imdbRating = prefs.ratingRange as [number, number];
            }
            
            // Load genres map - only if it has actual values
            if (prefs.genres && typeof prefs.genres === 'object') {
              const genresObj = prefs.genres as { [key: string]: number };
              // Only load if it has at least one genre, otherwise keep defaults
              if (Object.keys(genresObj).length > 0) {
                loadedPreferences.genres = genresObj;
              }
            }
            
            // Update preferences with loaded data
            setPreferences(prev => ({
              ...prev,
              ...loadedPreferences
            }));
            
            setPreferencesLoaded(true);
            console.log('Preferences loaded successfully');
          } else {
            // No saved preferences, mark as loaded with defaults
            setPreferencesLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
          // Still mark as loaded to allow user to set preferences
          setPreferencesLoaded(true);
        }
      } else {
        // Not logged in, use defaults
        setPreferencesLoaded(true);
      }
    };
    checkAuthStatus();
  }, []);

  // Auto-save preferences when they change (debounced)
  useEffect(() => {
    // Don't save until preferences have been loaded from backend
    if (!user || !preferencesLoaded) return;

    const saveTimer = setTimeout(async () => {
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
        console.log('Preferences auto-saved');
      } catch (error) {
        console.error('Failed to auto-save preferences:', error);
      }
    }, 1000); // Save 1 second after user stops changing preferences

    return () => clearTimeout(saveTimer);
  }, [preferences, user, preferencesLoaded]);

  // Save preferences before page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!user) return;

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
        console.error('Failed to save preferences on exit:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preferences, user]);

  const handleLogin = () => {
    authService.loginWithGoogle();
  };

  const handleLogout = async () => {
    // Save preferences before logging out
    if (user) {
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
        console.error('Failed to save preferences before logout:', error);
      }
    }

    const success = await authService.logout();
    if (success) {
      setUser(null);
      setShowProfileModal(false);
    }
  };

  const handleViewProfile = async () => {
    // Save preferences before viewing profile
    if (user) {
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
    setShowProfileModal(true);
  };

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
      setShowAuthPrompt(true);
      return;
    }

    console.log('%c🎬 FINDING MOVIES - START', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    console.log('%c📋 User Preferences:', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');
    console.log(JSON.stringify(preferences, null, 2));
    
    // Clear session movies for new search
    setSessionLikedMovies([]);
    setSessionDislikedMovies([]);
    
    // Show loading screen
    setCurrentView('loading');
    
    // Save preferences before searching
    if (user) {
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
        console.log('✅ Preferences saved to user profile');
      } catch (error) {
        console.error('❌ Failed to save preferences:', error);
      }
    }
    
    // Search for movies using AI
    try {
      console.log('%c🔍 Sending search request to backend...', 'background: #FF9800; color: white; padding: 5px; font-weight: bold;');
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
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
      
      console.log('%c📤 Request Payload:', 'background: #9C27B0; color: white; padding: 5px;');
      console.log(JSON.stringify(searchPayload, null, 2));
      
      const response = await fetch(`${backendUrl}/api/movies/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(searchPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('%c✅ SEARCH COMPLETE!', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
        console.log('%c📊 Search Results Summary:', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');
        console.log(`Total matches found: ${data.count}`);
        console.log(`Success: ${data.success}`);
        
        console.log('%c📥 Full API Response:', 'background: #9C27B0; color: white; padding: 5px;');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.movies && data.movies.length > 0) {
          console.log('%c🎯 Top 10 Movie Matches:', 'background: #FF5722; color: white; padding: 5px; font-weight: bold;');
          console.table(
            data.movies.slice(0, 10).map((movie: any, index: number) => ({
              '#': index + 1,
              'Title': movie.title,
              'Year': movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A',
              'Rating': `${movie.voteAverage}/10`,
              'Match %': `${(movie.matchScore * 100).toFixed(1)}%`,
              'Genres': movie.genres?.map((g: any) => g.name).join(', ') || 'N/A'
            }))
          );
          
          console.log('%c💡 Match Reasons (Top 5):', 'background: #00BCD4; color: white; padding: 5px; font-weight: bold;');
          data.movies.slice(0, 5).forEach((movie: any, index: number) => {
            console.log(`\n${index + 1}. ${movie.title} (${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'})`);
            console.log(`   🎯 Match Score: ${(movie.matchScore * 100).toFixed(1)}%`);
            console.log(`   ⭐ TMDB Rating: ${movie.voteAverage}/10`);
            console.log(`   🎭 Genres: ${movie.genres?.map((g: any) => g.name).join(', ')}`);
            console.log(`   💡 Why it matches: ${movie.matchReason}`);
            console.log(`   📝 Overview: ${movie.overview?.substring(0, 150)}...`);
          });
        } else {
          console.log('%c⚠️ No movies found matching criteria', 'background: #FF9800; color: white; padding: 5px;');
        }
        
        console.log('%c🎬 FINDING MOVIES - END', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
        
        // Navigate to results view
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies);
          setLikedMovies([]);
          setCurrentView('results');
        } else {
          setCurrentView('preferences');
          alert('No movies found. Try different preferences.');
        }
      } else {
        const error = await response.json();
        console.log('%c❌ SEARCH FAILED!', 'background: #F44336; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
        console.error('Error response:', error);
        setCurrentView('preferences');
        alert('Failed to find movies. Please try again.');
      }
    } catch (error) {
      console.log('%c❌ CONNECTION ERROR!', 'background: #F44336; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
      console.error('Error details:', error);
      setCurrentView('preferences');
      alert('Error connecting to server. Please check your connection.');
    }
  };

  const handleSubmitPreferencesDev = async () => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    console.log('%c🧪 DEV MODE - FINDING RANDOM MOVIES', 'background: #FF5722; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    
    // Show loading screen
    setCurrentView('loading');
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      // Fetch random movies
      const response = await fetch(`${backendUrl}/api/movies/random?count=10`, {
        credentials: 'include'
      });
      
      // Wait minimum 5 seconds for testing loading screen
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('%c✅ RANDOM MOVIES FETCHED!', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
        console.log(`Found ${data.count} random movies`);
        
        console.log('%c🎲 Random Movies:', 'background: #FF5722; color: white; padding: 5px; font-weight: bold;');
        console.table(
          data.movies.map((movie: any, index: number) => ({
            '#': index + 1,
            'Title': movie.title,
            'Year': movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A',
            'Rating': `${movie.voteAverage}/10`,
            'Genres': movie.genres?.map((g: any) => g.name).join(', ') || 'N/A'
          }))
        );
        
        // Navigate to results view
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies);
          setLikedMovies([]);
          setCurrentView('results');
        } else {
          setCurrentView('preferences');
          alert('No movies found.');
        }
      } else {
        console.log('%c❌ DEV MODE FAILED!', 'background: #F44336; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
        setCurrentView('preferences');
        alert('Failed to fetch random movies. Please try again.');
      }
    } catch (error) {
      console.log('%c❌ DEV MODE ERROR!', 'background: #F44336; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
      console.error('Error details:', error);
      setCurrentView('preferences');
      alert('Error connecting to server. Please check your connection.');
    }
  };

  // Load user's favorite movies on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/user/movies/favorites`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const ids = new Set<string>(data.favoriteMovies.map((m: any) => m.movieId));
          setFavoriteMovieIds(ids);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, [user]);

  // Handle like movie
  const handleLike = async (movie: Movie) => {
    // Add to session liked movies
    setSessionLikedMovies(prev => {
      const exists = prev.some(m => m.tmdbId === movie.tmdbId);
      if (exists) return prev;
      return [...prev, movie];
    });
    
    // Also add to global liked movies for consistency
    setLikedMovies(prev => {
      const exists = prev.some(m => m.tmdbId === movie.tmdbId);
      if (exists) return prev;
      return [...prev, movie];
    });
    
    if (user) {
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        await fetch(`${backendUrl}/api/user/movies/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            movieId: movie.tmdbId.toString(),
            title: movie.title,
            posterPath: movie.posterPath
          })
        });
      } catch (error) {
        console.error('Error saving liked movie:', error);
      }
    }
  };

  // Handle dislike movie
  const handleDislike = async (movie: Movie) => {
    // Add to session disliked movies
    setSessionDislikedMovies(prev => {
      const exists = prev.some(m => m.tmdbId === movie.tmdbId);
      if (exists) return prev;
      return [...prev, movie];
    });
    
    // Also add to global disliked movies for consistency
    setDislikedMovies(prev => {
      const exists = prev.some(m => m.tmdbId === movie.tmdbId);
      if (exists) return prev;
      return [...prev, movie];
    });
    
    if (user) {
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        await fetch(`${backendUrl}/api/user/movies/dislike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            movieId: movie.tmdbId.toString(),
            title: movie.title,
            posterPath: movie.posterPath
          })
        });
      } catch (error) {
        console.error('Error saving disliked movie:', error);
      }
    }
  };

  // Handle finish swiping
  const handleFinishSwiping = () => {
    setCurrentView('liked-summary');
  };

  // Handle add to favorites
  const handleAddToFavorites = async (movieId: string, title: string, posterPath: string) => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId, title, posterPath })
      });
      
      if (response.ok) {
        setFavoriteMovieIds(prev => new Set(prev).add(movieId));
        // Add to favoriteMovies array - check both global and session liked movies
        const movie = likedMovies.find(m => m.tmdbId.toString() === movieId) || 
                      sessionLikedMovies.find(m => m.tmdbId.toString() === movieId);
        if (movie) {
          setFavoriteMovies(prev => {
            const exists = prev.some(m => m.tmdbId.toString() === movieId);
            if (exists) return prev;
            return [...prev, movie];
          });
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  // Handle remove from favorites
  const handleRemoveFromFavorites = async (movieId: string) => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/favorites/${movieId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setFavoriteMovieIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
        setFavoriteMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  // Handle move to disliked
  const handleMoveToDisliked = async (movieId: string, title: string, posterPath: string) => {
    console.log('handleMoveToDisliked called:', movieId, title);
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/move-to-disliked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId, title, posterPath })
      });
      
      console.log('Move to disliked response:', response.ok);
      
      if (response.ok) {
        // Find the movie from either global or session arrays
        const movie = likedMovies.find(m => m.tmdbId.toString() === movieId) || 
                      favoriteMovies.find(m => m.tmdbId.toString() === movieId) ||
                      sessionLikedMovies.find(m => m.tmdbId.toString() === movieId);
        
        // Remove from liked movies (both global and session)
        setLikedMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
        setSessionLikedMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
        
        // Remove from favorites
        setFavoriteMovieIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
        setFavoriteMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
        
        // Add to disliked movies (both global and session)
        if (movie) {
          setDislikedMovies(prev => {
            const exists = prev.some(m => m.tmdbId.toString() === movieId);
            if (exists) return prev;
            return [...prev, movie];
          });
          setSessionDislikedMovies(prev => {
            const exists = prev.some(m => m.tmdbId.toString() === movieId);
            if (exists) return prev;
            return [...prev, movie];
          });
        }
      }
    } catch (error) {
      console.error('Error moving to disliked:', error);
    }
  };

  // Handle move to liked
  const handleMoveToLiked = async (movieId: string, title: string, posterPath: string) => {
    console.log('handleMoveToLiked called:', movieId, title);
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/move-to-liked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId, title, posterPath })
      });
      
      console.log('Move to liked response:', response.ok);
      
      if (response.ok) {
        // Find the movie from either global or session arrays
        const movie = dislikedMovies.find(m => m.tmdbId.toString() === movieId) ||
                      sessionDislikedMovies.find(m => m.tmdbId.toString() === movieId);
        
        // Remove from disliked movies (both global and session)
        setDislikedMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
        setSessionDislikedMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
        
        // Add to liked movies (both global and session)
        if (movie) {
          setLikedMovies(prev => {
            const exists = prev.some(m => m.tmdbId.toString() === movieId);
            if (exists) return prev;
            return [...prev, movie];
          });
          setSessionLikedMovies(prev => {
            const exists = prev.some(m => m.tmdbId.toString() === movieId);
            if (exists) return prev;
            return [...prev, movie];
          });
        }
      }
    } catch (error) {
      console.error('Error moving to liked:', error);
    }
  };

  // Handle view liked movies page
  const handleViewLikedMovies = async () => {
    if (!user) return;
    
    // Load liked movies and favorites from backend
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      // Fetch liked movies
      const likedResponse = await fetch(`${backendUrl}/api/user/movies/liked`, {
        credentials: 'include'
      });
      
      // Fetch favorites
      const favoritesResponse = await fetch(`${backendUrl}/api/user/movies/favorites`, {
        credentials: 'include'
      });
      
      if (likedResponse.ok && favoritesResponse.ok) {
        const likedData = await likedResponse.json();
        const favoritesData = await favoritesResponse.json();
        
        // Convert to Movie format
        const likedMoviesFromBackend = likedData.likedMovies?.map((m: any) => ({
          tmdbId: parseInt(m.movieId),
          title: m.title,
          posterPath: m.posterPath,
          overview: '',
          releaseDate: m.likedAt
        })) || [];
        
        const favoriteMoviesFromBackend = favoritesData.favoriteMovies?.map((m: any) => ({
          tmdbId: parseInt(m.movieId),
          title: m.title,
          posterPath: m.posterPath,
          overview: '',
          releaseDate: m.favoritedAt
        })) || [];
        
        setLikedMovies(likedMoviesFromBackend);
        setFavoriteMovies(favoriteMoviesFromBackend);
        setFavoriteMovieIds(new Set(favoriteMoviesFromBackend.map((m: Movie) => m.tmdbId.toString())));
        
        setCurrentView('liked-movies-page');
      }
    } catch (error) {
      console.error('Error loading liked movies:', error);
    }
  };

  // Handle view disliked movies page
  const handleViewDislikedMovies = async () => {
    if (!user) return;
    
    // Load disliked movies from backend
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/disliked`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const dislikedMoviesFromBackend = data.dislikedMovies?.map((m: any) => ({
          tmdbId: parseInt(m.movieId),
          title: m.title,
          posterPath: m.posterPath,
          overview: '',
          releaseDate: m.dislikedAt
        })) || [];
        
        setDislikedMovies(dislikedMoviesFromBackend);
        setCurrentView('disliked-movies-page');
      }
    } catch (error) {
      console.error('Error loading disliked movies:', error);
    }
  };

  // Handle back to home
  const handleBackToHome = () => {
    setCurrentView('preferences');
    setMovies([]);
    setLikedMovies([]);
    setSessionLikedMovies([]);
    setSessionDislikedMovies([]);
  };

  // Handle keep searching
  const handleKeepSearching = async () => {
    if (!user) return;
    
    setCurrentView('loading');
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/movies/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
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
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies);
          // Don't clear liked/disliked movies - keep the session intact
          setCurrentView('results');
        } else {
          setCurrentView('preferences');
          alert('No more movies found. Try different preferences.');
        }
      } else {
        setCurrentView('preferences');
        alert('Failed to fetch more movies.');
      }
    } catch (error) {
      console.error('Error fetching more movies:', error);
      setCurrentView('preferences');
      alert('Error connecting to server.');
    }
  };

  // Render based on current view
  if (currentView === 'loading') {
    return <LoadingScreen />;
  }

  if (currentView === 'results' && movies.length > 0) {
    return (
      <div className="App">
        <Header
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
          onLogin={handleLogin}
          onLogoClick={handleBackToHome}
          onViewLikedMovies={handleViewLikedMovies}
          onViewDislikedMovies={handleViewDislikedMovies}
        />
        <MovieSwiper
          movies={movies}
          onLike={handleLike}
          onDislike={handleDislike}
          onFinish={handleFinishSwiping}
        />
      </div>
    );
  }

  if (currentView === 'liked-summary') {
    // Create a Set of favorite movie IDs from the session liked movies that are favorited
    const sessionFavoriteIds = new Set(
      sessionLikedMovies
        .filter(m => favoriteMovieIds.has(m.tmdbId.toString()))
        .map(m => m.tmdbId.toString())
    );
    
    return (
      <div className="App">
        <Header
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
          onLogin={handleLogin}
          onLogoClick={handleBackToHome}
          onViewLikedMovies={handleViewLikedMovies}
          onViewDislikedMovies={handleViewDislikedMovies}
        />
        <LikedMoviesView
          movies={sessionLikedMovies}
          favoriteMovies={[]}
          dislikedMovies={sessionDislikedMovies}
          onAddToFavorites={handleAddToFavorites}
          onRemoveFromFavorites={handleRemoveFromFavorites}
          onMoveToDisliked={handleMoveToDisliked}
          onMoveToLiked={handleMoveToLiked}
          onBackToHome={handleBackToHome}
          onKeepSearching={handleKeepSearching}
          favoriteMovieIds={sessionFavoriteIds}
          showSessionActions={true}
        />
      </div>
    );
  }

  if (currentView === 'liked-movies-page') {
    // Filter out favorited movies from the liked section
    const nonFavoritedLikedMovies = likedMovies.filter(m => !favoriteMovieIds.has(m.tmdbId.toString()));
    
    return (
      <div className="App">
        <Header
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
          onLogin={handleLogin}
          onLogoClick={handleBackToHome}
          onViewLikedMovies={handleViewLikedMovies}
          onViewDislikedMovies={handleViewDislikedMovies}
        />
        <LikedMoviesView
          movies={nonFavoritedLikedMovies}
          favoriteMovies={favoriteMovies}
          onAddToFavorites={handleAddToFavorites}
          onRemoveFromFavorites={handleRemoveFromFavorites}
          onMoveToDisliked={handleMoveToDisliked}
          onBackToHome={handleBackToHome}
          onKeepSearching={handleKeepSearching}
          favoriteMovieIds={favoriteMovieIds}
          showSessionActions={false}
        />
      </div>
    );
  }

  if (currentView === 'disliked-movies-page') {
    return (
      <div className="App">
        <Header
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
          onLogin={handleLogin}
          onLogoClick={handleBackToHome}
          onViewLikedMovies={handleViewLikedMovies}
          onViewDislikedMovies={handleViewDislikedMovies}
        />
        <DislikedMoviesView
          movies={dislikedMovies}
          onMoveToLiked={handleMoveToLiked}
          onBackToHome={handleBackToHome}
          onKeepSearching={handleKeepSearching}
          showSessionActions={false}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        user={user}
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        onLogin={handleLogin}
        onLogoClick={handleBackToHome}
        onViewLikedMovies={handleViewLikedMovies}
        onViewDislikedMovies={handleViewDislikedMovies}
      />

      <main className="preferences-container">
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
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.max(120, e.target.scrollHeight) + 'px';
              }}
              onInput={(e) => {
                // Additional resize on input for better responsiveness
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
            <button onClick={handleSubmitPreferencesDev} className="dev-button">
              🧪 Find My Movies (Dev)
            </button>
            <button onClick={handleSubmitPreferences} className="submit-button">
              Find My Movies
            </button>
          </div>
        </div>
      </main>

      {/* Backend Connection Status */}
      <footer className="backend-status">
        <div className="connection-status">
          <div className={`status-indicator ${backendStatus.connected ? 'connected' : 'disconnected'} ${backendStatus.loading ? 'loading' : ''}`}>
            <div className="status-dot"></div>
            <span>{backendStatus.message}</span>
          </div>
          
          {!backendStatus.loading && (
            <button onClick={checkBackendConnection} className="retry-button">
              Test Backend Connection
            </button>
          )}
        </div>
      </footer>

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <AuthPromptModal 
          onClose={() => setShowAuthPrompt(false)} 
        />
      )}
    </div>
  )
}

export default App
