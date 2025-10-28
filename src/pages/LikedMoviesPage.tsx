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
          
          console.log('📥 Backend liked data:', likedData);
          console.log('📥 Backend favorites data:', favoritesData);
          
          // Convert to Movie format and filter out NaN IDs
          // Backend returns tmdbId directly, not movieId
          const likedMoviesFromBackend = (likedData.likedMovies?.map((m: any) => ({
            tmdbId: m.tmdbId || parseInt(m.movieId),
            title: m.title,
            posterPath: m.posterPath,
            overview: m.overview || '',
            releaseDate: m.releaseDate || m.likedAt
          })) || []).filter((m: Movie) => !isNaN(m.tmdbId) && isFinite(m.tmdbId));
          
          const favoriteMoviesFromBackend = (favoritesData.favoriteMovies?.map((m: any) => ({
            tmdbId: m.tmdbId || parseInt(m.movieId),
            title: m.title,
            posterPath: m.posterPath,
            overview: m.overview || '',
            releaseDate: m.releaseDate || m.favoritedAt
          })) || []).filter((m: Movie) => !isNaN(m.tmdbId) && isFinite(m.tmdbId));
          
          console.log('✅ Parsed liked movies:', likedMoviesFromBackend);
          console.log('✅ Parsed favorite movies:', favoriteMoviesFromBackend);
          
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

  console.log('=== LIKED MOVIES PAGE DEBUG ===');
  console.log('likedMovies:', likedMovies.length);
  console.log('favoriteMovies:', favoriteMovies.length);
  console.log('favoriteMovieIds Set:', Array.from(favoriteMovieIds));
  console.log('nonFavoritedLikedMovies:', nonFavoritedLikedMovies.length);
  console.log('likedMovies IDs:', likedMovies.map(m => m.tmdbId.toString()));
  console.log('favoriteMovies IDs:', favoriteMovies.map(m => m.tmdbId.toString()));

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
