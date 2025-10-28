import { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
}

const LoadingScreen: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch random movies for carousel
    const fetchRandomMovies = async () => {
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/movies/random?count=20`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter movies with posters only
          const moviesWithPosters = data.movies.filter((m: Movie) => m.posterPath);
          // Duplicate the movies array to create seamless loop
          setMovies([...moviesWithPosters, ...moviesWithPosters]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch random movies:', error);
        setLoading(false);
      }
    };

    fetchRandomMovies();
  }, []);

  const getPosterUrl = (posterPath: string) => {
    if (!posterPath) return 'https://via.placeholder.com/500x750?text=No+Poster';
    return `https://image.tmdb.org/t/p/w342${posterPath}`;
  };

  return (
    <div className="loading-screen-overlay">
      <div className="loading-screen">
        <div className="loading-content">
          <h2>🎬 Finding Your Perfect Movies...</h2>
          <p className="loading-subtitle">Our AI is analyzing thousands of films to match your preferences</p>
          
          <div className="loading-animation">
            <div className="spinner"></div>
          </div>

          <div className="loading-steps">
            <div className="step active">
              <div className="step-icon">📊</div>
              <p>Filtering database</p>
            </div>
            <div className="step active">
              <div className="step-icon">🤖</div>
              <p>AI analyzing movies</p>
            </div>
            <div className="step">
              <div className="step-icon">🎯</div>
              <p>Ranking matches</p>
            </div>
          </div>

          {!loading && movies.length > 0 && (
            <div className="movie-carousel">
              <div className="carousel-track">
                {movies.map((movie, index) => (
                  <div 
                    key={`${movie.tmdbId}-${index}`}
                    className="carousel-item"
                  >
                    <img 
                      src={getPosterUrl(movie.posterPath)} 
                      alt={movie.title}
                      className="poster-image"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="loading-tip">💡 Tip: Try adjusting mood and genre preferences for better results!</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
