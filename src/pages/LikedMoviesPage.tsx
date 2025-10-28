import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LikedMoviesView from '../components/LikedMoviesView';
import { User } from '../types/user';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  overview?: string;
  releaseDate?: string;
}

interface LikedMoviesPageProps {
  user: User | null;
  favoriteMovieIds: Set<string>;
  onAddToFavorites: (movieId: string, title: string, posterPath: string) => void;
  onRemoveFromFavorites: (movieId: string) => void;
  onMoveToDisliked: (movieId: string, title: string, posterPath: string) => void;
  refreshTrigger?: number;
}

const LikedMoviesPage: React.FC<LikedMoviesPageProps> = ({
  user,
  favoriteMovieIds,
  onAddToFavorites,
  onRemoveFromFavorites,
  onMoveToDisliked,
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      
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
        }
      } catch (error) {
        console.error('Error loading liked movies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMovies();
  }, [user, navigate, refreshTrigger]); // Add refreshTrigger to dependencies

  if (loading) {
    return null;
  }

  // Filter out favorited movies from the liked section
  const nonFavoritedLikedMovies = likedMovies.filter(m => !favoriteMovieIds.has(m.tmdbId.toString()));

  return (
    <LikedMoviesView
      movies={nonFavoritedLikedMovies}
      favoriteMovies={favoriteMovies}
      onAddToFavorites={onAddToFavorites}
      onRemoveFromFavorites={onRemoveFromFavorites}
      onMoveToDisliked={onMoveToDisliked}
      favoriteMovieIds={favoriteMovieIds}
      showSessionActions={false}
      showFilters={true}
    />
  );
};

export default LikedMoviesPage;
