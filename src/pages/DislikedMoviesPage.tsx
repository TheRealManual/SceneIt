import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DislikedMoviesView from '../components/DislikedMoviesView';
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

interface DislikedMoviesPageProps {
  user: User | null;
  onMoveToLiked: (movieId: string, title: string, posterPath: string) => void;
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, newRating: number) => void;
  refreshTrigger?: number;
}

const DislikedMoviesPage: React.FC<DislikedMoviesPageProps> = ({
  user,
  onMoveToLiked,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [dislikedMovies, setDislikedMovies] = useState<Movie[]>([]);
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
        const response = await fetch(`${backendUrl}/api/user/movies/disliked`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('📥 Backend disliked data:', data);
          
          // Backend returns tmdbId directly, not movieId
          const dislikedMoviesFromBackend = (data.dislikedMovies?.map((m: any) => ({
            tmdbId: m.tmdbId || parseInt(m.movieId),
            title: m.title,
            posterPath: m.posterPath,
            overview: m.overview || '',
            releaseDate: m.releaseDate || m.dislikedAt,
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
          
          console.log('✅ Parsed disliked movies:', dislikedMoviesFromBackend);
          
          setDislikedMovies(dislikedMoviesFromBackend);
        }
      } catch (error) {
        console.error('Error loading disliked movies:', error);
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

  // Apply watched movie filter
  const filteredDislikedMovies = showWatchedMovies === 'all'
    ? dislikedMovies
    : showWatchedMovies === 'watched'
    ? dislikedMovies.filter(m => watchedMovieIds.has(m.tmdbId.toString()))
    : dislikedMovies.filter(m => !watchedMovieIds.has(m.tmdbId.toString()));

  return (
    <DislikedMoviesView
      movies={filteredDislikedMovies}
      onMoveToLiked={onMoveToLiked}
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

export default DislikedMoviesPage;
