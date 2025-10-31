import { useNavigate } from 'react-router-dom';
import LikedMoviesView from '../components/LikedMoviesView';
import { User } from '../types/user';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  overview: string;
  releaseDate?: string;
}

interface SummaryPageProps {
  user: User | null;
  sessionLikedMovies: Movie[];
  sessionDislikedMovies: Movie[];
  favoriteMovieIds: Set<string>;
  onAddToFavorites: (movieId: string, title: string, posterPath: string) => void;
  onRemoveFromFavorites: (movieId: string) => void;
  onMoveToDisliked: (movieId: string, title: string, posterPath: string) => void;
  onMoveToLiked: (movieId: string, title: string, posterPath: string) => void;
}

const SummaryPage: React.FC<SummaryPageProps> = ({
  sessionLikedMovies,
  sessionDislikedMovies,
  favoriteMovieIds,
  onAddToFavorites,
  onRemoveFromFavorites,
  onMoveToDisliked,
  onMoveToLiked
}) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleKeepSearching = () => {
    // Go back to home to start a new search
    navigate('/');
  };

  const sessionFavoriteIds = new Set(
    sessionLikedMovies
      .filter(m => favoriteMovieIds.has(m.tmdbId.toString()))
      .map(m => m.tmdbId.toString())
  );

  return (
    <LikedMoviesView
      movies={sessionLikedMovies}
      favoriteMovies={[]}
      dislikedMovies={sessionDislikedMovies}
      onAddToFavorites={onAddToFavorites}
      onRemoveFromFavorites={onRemoveFromFavorites}
      onMoveToDisliked={onMoveToDisliked}
      onMoveToLiked={onMoveToLiked}
      onBackToHome={handleBackToHome}
      onKeepSearching={handleKeepSearching}
      favoriteMovieIds={sessionFavoriteIds}
      showSessionActions={true}
    />
  );
};

export default SummaryPage;
