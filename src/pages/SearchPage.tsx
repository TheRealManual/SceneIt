import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MovieSwiper from '../components/MovieSwiper';
import GameRatingModal from '../components/GameRatingModal';
import LoadingScreen from '../components/LoadingScreen';
import ErrorModal from '../components/ErrorModal';
import { User } from '../types/user';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  overview?: string;
  releaseDate?: string;
  genres?: Array<{ id: number; name: string }>;
  voteAverage?: number;
  runtime?: number;
}

interface SearchPageProps {
  user: User | null;
  onLike: (movie: Movie) => void;
  onDislike: (movie: Movie) => void;
  onWatch?: (movie: Movie, rating: number) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ user, onLike, onDislike, onWatch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGameRating, setShowGameRating] = useState(false);
  const [shouldShowRating, setShouldShowRating] = useState(false);
  const [searchPreferences, setSearchPreferences] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchMovies = async () => {
      // Prevent duplicate fetches in React StrictMode
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      if (!user) {
        navigate('/');
        return;
      }

      const preferences = location.state?.preferences;
      const devMode = location.state?.devMode;
      
      if (!preferences) {
        navigate('/');
        return;
      }

      // Store preferences for later use in rating submission
      setSearchPreferences(preferences);

      // MovieSwiper always fetches fresh search results (no caching)

      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        
        // Dev mode: fetch random movies
        if (devMode) {
          console.log('%c🧪 DEV MODE - FINDING RANDOM MOVIES', 'background: #FF5722; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
          
          const response = await fetch(`${backendUrl}/api/movies/random?count=10`, {
            credentials: 'include'
          });
          
          // Wait minimum 2 seconds for loading screen
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            if (response.status === 503 && data.code === 'TMDB_UNAVAILABLE') {
              setLoading(false);
              setShowErrorModal(true);
              return;
            }
            alert('Failed to fetch random movies. Please try again.');
            navigate('/');
            return;
          }
          
          if (response.ok) {
            const data = await response.json();
            
            console.log('%c✅ RANDOM MOVIES FETCHED!', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
            console.log(`Found ${data.count} random movies`);
            
            if (data.movies && data.movies.length > 0) {
              console.log('🎬 Fetched Movie IDs (Dev):', data.movies.map((m: any) => `${m.tmdbId} (${m.title})`));
              setMovies(data.movies);
            } else {
              alert('No movies found.');
              navigate('/');
            }
          }
        } else {
          // Normal mode: AI-powered search
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
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(searchPayload)
          });
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            if (response.status === 503 && data.code === 'TMDB_UNAVAILABLE') {
              setLoading(false);
              setShowErrorModal(true);
              return;
            }
            alert('Failed to find movies. Please try again.');
            navigate('/');
            return;
          }
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.movies && data.movies.length > 0) {
              setMovies(data.movies);
            } else {
              alert('No movies found. Try different preferences.');
              navigate('/');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        setLoading(false);
        setShowErrorModal(true);
      } finally {
        setLoading(false);
        // Always show rating modal
        setShouldShowRating(true);
      }
    };

    fetchMovies();
  }, [location.state, navigate, user]);

  const handleFinishSwiping = () => {
    if (shouldShowRating) {
      setShowGameRating(true);
    } else {
      navigate('/summary');
    }
  };

  const handleSubmitRating = async (rating: number, movieFeedback: { [movieId: number]: 'good' | 'bad' }) => {
    try {
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      const response = await fetch(`${backendUrl}/api/game-rating/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          overallRating: rating,
          movieFeedback: movieFeedback,
          gameMovies: movies.map(m => m.tmdbId),
          searchPreferences: searchPreferences
        })
      });

      if (response.ok) {
        console.log('✅ Game rating submitted successfully');
      } else {
        console.error('Failed to submit game rating');
      }
    } catch (error) {
      console.error('Error submitting game rating:', error);
    } finally {
      navigate('/summary');
    }
  };

  const handleSkipRating = () => {
    navigate('/summary');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <>
      {showErrorModal && (
        <ErrorModal
          onClose={() => {
            setShowErrorModal(false);
            navigate('/');
          }}
          title="Service Unavailable"
          message="The movie database is temporarily unavailable. Please try again in a moment."
          icon="⚠️"
        />
      )}
      
      <MovieSwiper
        movies={movies}
        onLike={onLike}
        onDislike={onDislike}
        onWatch={onWatch}
        onFinish={handleFinishSwiping}
      />
      
      {showGameRating && (
        <GameRatingModal
          movies={movies}
          onSubmit={handleSubmitRating}
          onSkip={handleSkipRating}
        />
      )}
    </>
  );
};

export default SearchPage;
