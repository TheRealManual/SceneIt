import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import ProfileModal from './components/ProfileModal'
import AuthPromptModal from './components/AuthPromptModal'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import SummaryPage from './pages/SummaryPage'
import LikedMoviesPage from './pages/LikedMoviesPage'
import DislikedMoviesPage from './pages/DislikedMoviesPage'
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

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<Set<string>>(new Set());
  const [movieListRefreshTrigger, setMovieListRefreshTrigger] = useState(0);
  
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
      
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const isDev = import.meta.env.DEV;
      const envMode = isDev ? 'Development' : 'Production';
      
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
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userProfile = await userService.getProfile();
          if (userProfile && userProfile.preferences) {
            const loadedPreferences: Partial<MoviePreferences> = {};
            const prefs = userProfile.preferences;
            
            if (prefs.description) loadedPreferences.description = prefs.description;
            if (prefs.ageRating) loadedPreferences.ageRating = prefs.ageRating;
            if (prefs.language) loadedPreferences.language = prefs.language;
            
            if (prefs.moodIntensity !== undefined) loadedPreferences.moodIntensity = prefs.moodIntensity;
            if (prefs.humorLevel !== undefined) loadedPreferences.humorLevel = prefs.humorLevel;
            if (prefs.violenceLevel !== undefined) loadedPreferences.violenceLevel = prefs.violenceLevel;
            if (prefs.romanceLevel !== undefined) loadedPreferences.romanceLevel = prefs.romanceLevel;
            if (prefs.complexityLevel !== undefined) loadedPreferences.complexityLevel = prefs.complexityLevel;
            
            if (prefs.yearRange && prefs.yearRange.length === 2) {
              loadedPreferences.releaseYear = prefs.yearRange as [number, number];
            }
            if (prefs.runtimeRange && prefs.runtimeRange.length === 2) {
              loadedPreferences.runtime = prefs.runtimeRange as [number, number];
            }
            if (prefs.ratingRange && prefs.ratingRange.length === 2) {
              loadedPreferences.imdbRating = prefs.ratingRange as [number, number];
            }
            
            if (prefs.genres && typeof prefs.genres === 'object') {
              const genresObj = prefs.genres as { [key: string]: number };
              if (Object.keys(genresObj).length > 0) {
                loadedPreferences.genres = genresObj;
              }
            }
            
            setPreferences(prev => ({
              ...prev,
              ...loadedPreferences
            }));
            
            setPreferencesLoaded(true);
          } else {
            setPreferencesLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
          setPreferencesLoaded(true);
        }
      } else {
        setPreferencesLoaded(true);
      }
    };
    checkAuthStatus();
  }, []);

  // Auto-save preferences when they change (debounced)
  useEffect(() => {
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
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [preferences, user, preferencesLoaded]);

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
          console.log('📥 Loading favorite IDs from backend:', data.favoriteMovies);
          // Backend returns tmdbId, not movieId
          const ids = new Set<string>(
            data.favoriteMovies
              .map((m: any) => {
                const id = m.tmdbId || m.movieId;
                return id ? id.toString() : null;
              })
              .filter((id: string | null) => id !== null)
          );
          console.log('✅ Favorite IDs Set:', Array.from(ids));
          setFavoriteMovieIds(ids);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, [user]);

  const handleLogin = () => {
    authService.loginWithGoogle();
  };

  const handleLogout = async () => {
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
      navigate('/');
    }
  };

  const handleViewProfile = async () => {
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

  const handleLike = async (movie: Movie) => {
    setSessionLikedMovies(prev => {
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
            movieId: movie.tmdbId.toString()
          })
        });
      } catch (error) {
        console.error('Error saving liked movie:', error);
      }
    }
  };

  const handleDislike = async (movie: Movie) => {
    setSessionDislikedMovies(prev => {
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
            movieId: movie.tmdbId.toString()
          })
        });
      } catch (error) {
        console.error('Error saving disliked movie:', error);
      }
    }
  };

  const handleAddToFavorites = async (movieId: string, _title: string, _posterPath: string) => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId })
      });
      
      if (response.ok) {
        setFavoriteMovieIds(prev => new Set(prev).add(movieId));
        // Trigger refresh of movie lists
        setMovieListRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const handleRemoveFromFavorites = async (movieId: string) => {
    if (!user) return;
    
    console.log('=== UNFAVORITE DEBUG ===');
    console.log('Removing favorite:', movieId);
    console.log('favoriteMovieIds before:', Array.from(favoriteMovieIds));
    
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
          console.log('favoriteMovieIds after:', Array.from(newSet));
          return newSet;
        });
        // Trigger refresh of movie lists
        setMovieListRefreshTrigger(prev => {
          console.log('Refresh trigger incrementing from', prev, 'to', prev + 1);
          return prev + 1;
        });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const handleMoveToDisliked = async (movieId: string, _title: string, _posterPath: string) => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/move-to-disliked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId })
      });
      
      if (response.ok) {
        // Update favorite IDs (remove if it was favorited)
        setFavoriteMovieIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
        
        // Update session state - move from liked to disliked
        const movedMovie = sessionLikedMovies.find(m => m.tmdbId.toString() === movieId);
        if (movedMovie) {
          setSessionLikedMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
          setSessionDislikedMovies(prev => [...prev, movedMovie]);
        }
        
        // Trigger refresh of movie lists in pages
        setMovieListRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error moving to disliked:', error);
    }
  };

  const handleMoveToLiked = async (movieId: string, _title: string, _posterPath: string) => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/move-to-liked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId })
      });
      
      if (response.ok) {
        // Update session state - move from disliked to liked
        const movedMovie = sessionDislikedMovies.find(m => m.tmdbId.toString() === movieId);
        if (movedMovie) {
          setSessionDislikedMovies(prev => prev.filter(m => m.tmdbId.toString() !== movieId));
          setSessionLikedMovies(prev => [...prev, movedMovie]);
        }
        
        // Trigger refresh of movie lists in pages
        setMovieListRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error moving to liked:', error);
    }
  };

  const handleViewLikedMovies = () => {
    navigate('/liked');
  };

  const handleViewDislikedMovies = () => {
    navigate('/disliked');
  };

  const handleClearLikedMovies = async () => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/liked/clear`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear session state
        setSessionLikedMovies([]);
        
        // Trigger refresh of movie lists in pages
        setMovieListRefreshTrigger(prev => prev + 1);
        
        alert('All liked movies have been cleared.');
      } else {
        alert('Failed to clear liked movies. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing liked movies:', error);
      alert('Error clearing liked movies. Please try again.');
    }
  };

  const handleClearDislikedMovies = async () => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/user/movies/disliked/clear`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear session state
        setSessionDislikedMovies([]);
        
        // Trigger refresh of movie lists in pages
        setMovieListRefreshTrigger(prev => prev + 1);
        
        alert('All disliked movies have been cleared.');
      } else {
        alert('Failed to clear disliked movies. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing disliked movies:', error);
      alert('Error clearing disliked movies. Please try again.');
    }
  };

  const handleLogoClick = () => {
    // Clear session data when going home
    setSessionLikedMovies([]);
    setSessionDislikedMovies([]);
    navigate('/');
  };

  // Preload liked movies on hover
  const handlePreloadLikedMovies = async () => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      console.log('🚀 Preloading liked movies and posters...');
      
      // Fetch both liked and favorites
      const [likedResponse, favoritesResponse] = await Promise.all([
        fetch(`${backendUrl}/api/user/movies/liked`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/user/movies/favorites`, { credentials: 'include' })
      ]);
      
      // Preload poster images
      if (likedResponse.ok && favoritesResponse.ok) {
        const likedData = await likedResponse.json();
        const favoritesData = await favoritesResponse.json();
        
        const allMovies = [
          ...(likedData.likedMovies || []),
          ...(favoritesData.favoriteMovies || [])
        ];
        
        if (allMovies.length > 0) {
          console.log(`📸 Preloading ${allMovies.length} movie posters...`);
          const imagePromises = allMovies.map((movie: any) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
            });
          });
          
          await Promise.all(imagePromises);
          console.log('✅ All liked movie posters preloaded!');
        }
      }
    } catch (error) {
      console.log('Preload error (will load normally):', error);
    }
  };

  // Preload disliked movies on hover
  const handlePreloadDislikedMovies = async () => {
    if (!user) return;
    
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      console.log('🚀 Preloading disliked movies and posters...');
      
      const response = await fetch(`${backendUrl}/api/user/movies/disliked`, { credentials: 'include' });
      
      // Preload poster images
      if (response.ok) {
        const data = await response.json();
        
        if (data.dislikedMovies && data.dislikedMovies.length > 0) {
          console.log(`📸 Preloading ${data.dislikedMovies.length} movie posters...`);
          const imagePromises = data.dislikedMovies.map((movie: any) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
            });
          });
          
          await Promise.all(imagePromises);
          console.log('✅ All disliked movie posters preloaded!');
        }
      }
    } catch (error) {
      console.log('Preload error (will load normally):', error);
    }
  };

  return (
    <div className="App">
      <Header
        user={user}
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
        onLogin={handleLogin}
        onLogoClick={handleLogoClick}
        onViewLikedMovies={handleViewLikedMovies}
        onViewDislikedMovies={handleViewDislikedMovies}
        onPreloadLikedMovies={handlePreloadLikedMovies}
        onPreloadDislikedMovies={handlePreloadDislikedMovies}
      />

      <Routes>
        <Route 
          path="/" 
          element={
            <HomePage 
              user={user}
              preferences={preferences}
              setPreferences={setPreferences}
              preferencesLoaded={preferencesLoaded}
              onShowAuthPrompt={() => setShowAuthPrompt(true)}
            />
          } 
        />
        <Route 
          path="/search" 
          element={
            <SearchPage 
              user={user}
              onLike={handleLike}
              onDislike={handleDislike}
            />
          } 
        />
        <Route 
          path="/summary" 
          element={
            <SummaryPage 
              user={user}
              sessionLikedMovies={sessionLikedMovies}
              sessionDislikedMovies={sessionDislikedMovies}
              favoriteMovieIds={favoriteMovieIds}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              onMoveToDisliked={handleMoveToDisliked}
              onMoveToLiked={handleMoveToLiked}
            />
          } 
        />
        <Route 
          path="/liked" 
          element={
            <LikedMoviesPage 
              user={user}
              favoriteMovieIds={favoriteMovieIds}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              onMoveToDisliked={handleMoveToDisliked}
              refreshTrigger={movieListRefreshTrigger}
            />
          } 
        />
        <Route 
          path="/disliked" 
          element={
            <DislikedMoviesPage 
              user={user}
              onMoveToLiked={handleMoveToLiked}
              refreshTrigger={movieListRefreshTrigger}
            />
          } 
        />
      </Routes>

      {/* Backend Connection Status */}
      {location.pathname === '/' && (
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
      )}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)}
          onClearLikedMovies={handleClearLikedMovies}
          onClearDislikedMovies={handleClearDislikedMovies}
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
