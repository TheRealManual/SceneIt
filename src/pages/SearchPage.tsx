import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MovieSwiper from '../components/MovieSwiper';
import LoadingScreen from '../components/LoadingScreen';
import { User } from '../types/user';

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

interface SearchPageProps {
  user: User | null;
  onLike: (movie: Movie) => void;
  onDislike: (movie: Movie) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ user, onLike, onDislike }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
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
          } else {
            alert('Failed to fetch random movies. Please try again.');
            navigate('/');
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
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.movies && data.movies.length > 0) {
              setMovies(data.movies);
            } else {
              alert('No movies found. Try different preferences.');
              navigate('/');
            }
          } else {
            alert('Failed to find movies. Please try again.');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        alert('Error connecting to server. Please check your connection.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [location.state, navigate, user]);

  const handleFinishSwiping = () => {
    navigate('/summary');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <MovieSwiper
      movies={movies}
      onLike={onLike}
      onDislike={onDislike}
      onFinish={handleFinishSwiping}
    />
  );
};

export default SearchPage;
