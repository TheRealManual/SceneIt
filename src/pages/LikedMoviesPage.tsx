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
  userRating?: number;
  averageRating?: number;
  ratingCount?: number;
}

interface LikedMoviesPageProps {
  user: User | null;
  favoriteMovieIds: Set<string>;
  onAddToFavorites: (movieId: string, title: string, posterPath: string) => void;
  onRemoveFromFavorites: (movieId: string) => void;
  onMoveToDisliked: (movieId: string, title: string, posterPath: string) => void;
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, newRating: number) => void;
  refreshTrigger?: number;
}

const LikedMoviesPage: React.FC<LikedMoviesPageProps> = ({
  user,
  favoriteMovieIds,
  onAddToFavorites,
  onRemoveFromFavorites,
  onMoveToDisliked,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWatchedMovies, setShowWatchedMovies] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [watchedMovieIds, setWatchedMovieIds] = useState<Set<string>>(new Set());

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
            releaseDate: m.releaseDate || m.likedAt,
            genres: m.genres,
            voteAverage: m.voteAverage,
            ageRating: m.ageRating,
            runtime: m.runtime,
            keywords: m.keywords,
            language: m.language,
            director: m.director,
            cast: m.cast,
            userRating: m.userRating,
            averageRating: m.averageRating,
            ratingCount: m.ratingCount
          })) || []).filter((m: Movie) => !isNaN(m.tmdbId) && isFinite(m.tmdbId));
          
          const favoriteMoviesFromBackend = (favoritesData.favoriteMovies?.map((m: any) => ({
            tmdbId: m.tmdbId || parseInt(m.movieId),
            title: m.title,
            posterPath: m.posterPath,
            overview: m.overview || '',
            releaseDate: m.releaseDate || m.favoritedAt,
            genres: m.genres,
            voteAverage: m.voteAverage,
            ageRating: m.ageRating,
            runtime: m.runtime,
            keywords: m.keywords,
            language: m.language,
            director: m.director,
            cast: m.cast,
            userRating: m.userRating,
            averageRating: m.averageRating,
            ratingCount: m.ratingCount
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

  // Fetch watched movies to enable filtering
  useEffect(() => {
    const fetchWatchedMovies = async () => {
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/user/movies/watched`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const watchedIds = new Set<string>();
          // Backend returns { watchedMovies: [...] }
          const watchedMovies = data.watchedMovies || [];
          watchedMovies.forEach((item: { tmdbId: number }) => {
            watchedIds.add(item.tmdbId.toString());
          });
          setWatchedMovieIds(watchedIds);
        }
      } catch (error) {
        console.error('Failed to fetch watched movies:', error);
      }
    };

    if (user) {
      fetchWatchedMovies();
    }
  }, [user, refreshTrigger]);

  if (loading) {
    return null;
  }

  // Filter out favorited movies from the liked section
  const nonFavoritedLikedMovies = likedMovies.filter(m => !favoriteMovieIds.has(m.tmdbId.toString()));

  // Apply watched movie filter
  const filteredLikedMovies = showWatchedMovies === 'all'
    ? nonFavoritedLikedMovies 
    : showWatchedMovies === 'watched'
    ? nonFavoritedLikedMovies.filter(m => watchedMovieIds.has(m.tmdbId.toString()))
    : nonFavoritedLikedMovies.filter(m => !watchedMovieIds.has(m.tmdbId.toString()));

  const filteredFavoriteMovies = showWatchedMovies === 'all'
    ? favoriteMovies
    : showWatchedMovies === 'watched'
    ? favoriteMovies.filter(m => watchedMovieIds.has(m.tmdbId.toString()))
    : favoriteMovies.filter(m => !watchedMovieIds.has(m.tmdbId.toString()));

  console.log('=== LIKED MOVIES PAGE DEBUG ===');
  console.log('likedMovies:', likedMovies.length);
  console.log('favoriteMovies:', favoriteMovies.length);
  console.log('favoriteMovieIds Set:', Array.from(favoriteMovieIds));
  console.log('nonFavoritedLikedMovies:', nonFavoritedLikedMovies.length);
  console.log('likedMovies IDs:', likedMovies.map(m => m.tmdbId.toString()));
  console.log('favoriteMovies IDs:', favoriteMovies.map(m => m.tmdbId.toString()));

  return (
    <LikedMoviesView
      movies={filteredLikedMovies}
      favoriteMovies={filteredFavoriteMovies}
      onAddToFavorites={onAddToFavorites}
      onRemoveFromFavorites={onRemoveFromFavorites}
      onMoveToDisliked={onMoveToDisliked}
      favoriteMovieIds={favoriteMovieIds}
      onWatch={onWatch}
      onUnwatch={onUnwatch}
      onUpdateWatchedRating={onUpdateWatchedRating}
      showWatchedMovies={showWatchedMovies}
      onToggleShowWatched={setShowWatchedMovies}
      showSessionActions={false}
      showFilters={true}
    />
  );
};

export default LikedMoviesPage;
