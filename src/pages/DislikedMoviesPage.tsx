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
}

interface DislikedMoviesPageProps {
  user: User | null;
  onMoveToLiked: (movieId: string, title: string, posterPath: string) => void;
  refreshTrigger?: number;
}

const DislikedMoviesPage: React.FC<DislikedMoviesPageProps> = ({
  user,
  onMoveToLiked,
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [dislikedMovies, setDislikedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

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
            releaseDate: m.releaseDate || m.dislikedAt
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

  if (loading) {
    return null;
  }

  return (
    <DislikedMoviesView
      movies={dislikedMovies}
      onMoveToLiked={onMoveToLiked}
      showSessionActions={false}
      showFilters={true}
    />
  );
};

export default DislikedMoviesPage;
