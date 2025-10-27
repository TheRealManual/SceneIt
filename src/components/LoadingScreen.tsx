import { useState, useEffect, useMemo } from 'react';
import './LoadingScreen.css';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
}

const LoadingScreen: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch random movies for carousel
    const fetchRandomMovies = async () => {
      try {
        const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/api/movies/random?count=15`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter movies with posters only
          const moviesWithPosters = data.movies.filter((m: Movie) => m.posterPath);
          setMovies(moviesWithPosters);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch random movies:', error);
        setLoading(false);
      }
    };

    fetchRandomMovies();
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 2500); // Slightly slower for smoother transitions

    return () => clearInterval(interval);
  }, [movies.length]); // Only depend on length

  const getPosterUrl = (posterPath: string) => {
    if (!posterPath) return 'https://via.placeholder.com/500x750?text=No+Poster';
    return `https://image.tmdb.org/t/p/w342${posterPath}`; // Smaller image for faster loading
  };

  // Memoize visible movies to prevent recalculation
  const visibleMovies = useMemo(() => {
    if (movies.length === 0) return [];
    const visible = [];
    for (let i = 0; i < 5; i++) {
      const index = (currentIndex + i) % movies.length;
      visible.push({
        movie: movies[index],
        isCenter: i === 2,
        key: `${movies[index].tmdbId}-${currentIndex}-${i}` // Stable key
      });
    }
    return visible;
  }, [movies, currentIndex]);

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
                {visibleMovies.map((item) => (
                  <div 
                    key={item.key} 
                    className={`carousel-item ${item.isCenter ? 'center' : ''}`}
                  >
                    <img 
                      src={getPosterUrl(item.movie.posterPath)} 
                      alt={item.movie.title}
                      className="poster-image"
                      loading="lazy"
                    />
                    {item.isCenter && (
                      <div className="poster-title">{item.movie.title}</div>
                    )}
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
