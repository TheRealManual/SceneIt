import { useState, useEffect } from 'react'
import './App.css'

interface BackendStatus {
  connected: boolean;
  message: string;
  loading: boolean;
}

interface MoviePreferences {
  description: string;
  releaseYear: [number, number];
  runtime: [number, number];
  imdbRating: [number, number];
  ageRating: string;
  moodIntensity: number;
  humorLevel: number;
  violenceLevel: number;
  romanceLevel: number;
  complexityLevel: number;
  genres: { [key: string]: number };
  language: string;
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    connected: false,
    message: 'Checking connection...',
    loading: true
  });

  const [preferences, setPreferences] = useState<MoviePreferences>({
    description: '',
    releaseYear: [1950, 2025],
    runtime: [60, 180],
    imdbRating: [1, 10],
    ageRating: 'Any',
    moodIntensity: 5,
    humorLevel: 5,
    violenceLevel: 5,
    romanceLevel: 5,
    complexityLevel: 5,
    genres: {
      'Action': 5,
      'Comedy': 5,
      'Drama': 5,
      'Horror': 5,
      'Romance': 5,
      'Thriller': 5,
      'Sci-Fi': 5,
      'Fantasy': 5,
      'Animation': 5,
      'Documentary': 5
    },
    language: 'English'
  });

  const checkBackendConnection = async () => {
    try {
      setBackendStatus(prev => ({ ...prev, loading: true, message: 'Connecting...' }));
      
      // Use Vite environment variables
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      const response = await fetch(`${backendUrl}/api/status`);
      
      if (response.ok) {
        const data = await response.json();
        setBackendStatus({
          connected: true,
          message: data.message || 'Connected to backend!',
          loading: false
        });
      } else {
        throw new Error('Backend response not ok');
      }
    } catch (error) {
      setBackendStatus({
        connected: false,
        message: 'Unable to connect to backend',
        loading: false
      });
    }
  };

  useEffect(() => {
    checkBackendConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClearPreferences = () => {
    setPreferences({
      description: '',
      releaseYear: [1950, 2025],
      runtime: [60, 180],
      imdbRating: [1, 10],
      ageRating: 'Any',
      moodIntensity: 5,
      humorLevel: 5,
      violenceLevel: 5,
      romanceLevel: 5,
      complexityLevel: 5,
      genres: {
        'Action': 5,
        'Comedy': 5,
        'Drama': 5,
        'Horror': 5,
        'Romance': 5,
        'Thriller': 5,
        'Sci-Fi': 5,
        'Fantasy': 5,
        'Animation': 5,
        'Documentary': 5
      },
      language: 'English'
    });
  };

  const handleSubmitPreferences = () => {
    console.log('Movie Preferences:', preferences);
    // TODO: Navigate to tinder-like recommendation screen
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 SceneIt</h1>
        <p>Find Your Perfect Movie Match</p>
      </header>

      <main className="preferences-container">
        <div className="preferences-form">
          <h2>Tell Us What You're Looking For</h2>
          
          {/* Movie Description */}
          <div className="form-section">
            <label htmlFor="description">Describe Your Ideal Movie</label>
            <textarea
              id="description"
              value={preferences.description}
              onChange={(e) => {
                setPreferences(prev => ({ ...prev, description: e.target.value }));
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.max(120, e.target.scrollHeight) + 'px';
              }}
              onInput={(e) => {
                // Additional resize on input for better responsiveness
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.max(120, target.scrollHeight) + 'px';
              }}
              placeholder="Tell us in detail what kind of movie you want to watch. Include themes, plot elements, mood, or anything specific you're looking for..."
              className="movie-description"
              rows={4}
            />
          </div>

          {/* Basic Movie Properties */}
          <div className="form-section">
            <h3>Movie Details</h3>
            <div className="sliders-grid">
              <div className="slider-group">
                <label>Release Year: {preferences.releaseYear[0]} - {preferences.releaseYear[1]}</label>
                <div className="range-slider-container">
                  <input
                    type="range"
                    min="1900"
                    max="2025"
                    value={preferences.releaseYear[0]}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      releaseYear: [parseInt(e.target.value), prev.releaseYear[1]] 
                    }))}
                    className="range-slider"
                  />
                  <input
                    type="range"
                    min="1900"
                    max="2025"
                    value={preferences.releaseYear[1]}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      releaseYear: [prev.releaseYear[0], parseInt(e.target.value)] 
                    }))}
                    className="range-slider"
                  />
                </div>
              </div>

              <div className="slider-group">
                <label>Runtime: {preferences.runtime[0]} - {preferences.runtime[1]} minutes</label>
                <div className="range-slider-container">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    value={preferences.runtime[0]}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      runtime: [parseInt(e.target.value), prev.runtime[1]] 
                    }))}
                    className="range-slider"
                  />
                  <input
                    type="range"
                    min="30"
                    max="300"
                    value={preferences.runtime[1]}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      runtime: [prev.runtime[0], parseInt(e.target.value)] 
                    }))}
                    className="range-slider"
                  />
                </div>
              </div>

              <div className="slider-group">
                <label>IMDb Rating: {preferences.imdbRating[0]} - {preferences.imdbRating[1]}</label>
                <div className="range-slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={preferences.imdbRating[0]}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      imdbRating: [parseFloat(e.target.value), prev.imdbRating[1]] 
                    }))}
                    className="range-slider"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={preferences.imdbRating[1]}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      imdbRating: [prev.imdbRating[0], parseFloat(e.target.value)] 
                    }))}
                    className="range-slider"
                  />
                </div>
              </div>

              <div className="slider-group">
                <label htmlFor="ageRating">Age Rating</label>
                <select
                  id="ageRating"
                  value={preferences.ageRating}
                  onChange={(e) => setPreferences(prev => ({ ...prev, ageRating: e.target.value }))}
                  className="dropdown"
                >
                  <option value="Any">Any Rating</option>
                  <option value="G">G - General Audiences</option>
                  <option value="PG">PG - Parental Guidance</option>
                  <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                  <option value="R">R - Restricted</option>
                  <option value="NC-17">NC-17 - Adults Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content & Mood Levels */}
          <div className="form-section">
            <h3>Content & Mood</h3>
            <div className="sliders-grid">
              <div className="slider-group">
                <label>Mood Intensity: {preferences.moodIntensity}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={preferences.moodIntensity}
                  onChange={(e) => setPreferences(prev => ({ ...prev, moodIntensity: parseInt(e.target.value) }))}
                  className="range-slider single"
                />
              </div>

              <div className="slider-group">
                <label>Humor Level: {preferences.humorLevel}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={preferences.humorLevel}
                  onChange={(e) => setPreferences(prev => ({ ...prev, humorLevel: parseInt(e.target.value) }))}
                  className="range-slider single"
                />
              </div>

              <div className="slider-group">
                <label>Violence Level: {preferences.violenceLevel}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={preferences.violenceLevel}
                  onChange={(e) => setPreferences(prev => ({ ...prev, violenceLevel: parseInt(e.target.value) }))}
                  className="range-slider single"
                />
              </div>

              <div className="slider-group">
                <label>Romance Level: {preferences.romanceLevel}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={preferences.romanceLevel}
                  onChange={(e) => setPreferences(prev => ({ ...prev, romanceLevel: parseInt(e.target.value) }))}
                  className="range-slider single"
                />
              </div>

              <div className="slider-group">
                <label>Complexity Level: {preferences.complexityLevel}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={preferences.complexityLevel}
                  onChange={(e) => setPreferences(prev => ({ ...prev, complexityLevel: parseInt(e.target.value) }))}
                  className="range-slider single"
                />
              </div>
            </div>
          </div>

          {/* Genre Preferences */}
          <div className="form-section">
            <h3>Genre Preferences</h3>
            <div className="genre-grid">
              {Object.entries(preferences.genres).map(([genre, value]) => (
                <div key={genre} className="slider-group">
                  <label>{genre}: {value}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={value}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      genres: { ...prev.genres, [genre]: parseInt(e.target.value) }
                    }))}
                    className="range-slider single"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="form-section">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              value={preferences.language}
              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              className="dropdown"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Italian">Italian</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Mandarin">Mandarin</option>
              <option value="Hindi">Hindi</option>
              <option value="Any">Any Language</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button onClick={handleClearPreferences} className="clear-button">
              Clear All
            </button>
            <button onClick={handleSubmitPreferences} className="submit-button">
              Find My Movies
            </button>
          </div>
        </div>
      </main>

      {/* Backend Connection Status */}
      <footer className="backend-status">
        <div className="connection-status">
          <div className={`status-indicator ${backendStatus.connected ? 'connected' : 'disconnected'} ${backendStatus.loading ? 'loading' : ''}`}>
            <div className="status-dot"></div>
            <span>{backendStatus.message}</span>
          </div>
          
          {!backendStatus.loading && (
            <button onClick={checkBackendConnection} className="retry-button">
              Test Backend Connection
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default App
