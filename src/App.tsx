import { useState, useEffect } from 'react'
import './App.css'

interface BackendStatus {
  connected: boolean;
  message: string;
  loading: boolean;
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    connected: false,
    message: 'Checking connection...',
    loading: true
  });

  const checkBackendConnection = async () => {
    try {
      setBackendStatus(prev => ({ ...prev, loading: true, message: 'Connecting...' }));
      
      // Use Vite environment variables
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 SceneIt</h1>
        <p>Your Movie Recommendation Destination</p>
        
        <div className="connection-status">
          <div className={`status-indicator ${backendStatus.connected ? 'connected' : 'disconnected'} ${backendStatus.loading ? 'loading' : ''}`}>
            <div className="status-dot"></div>
            <span>{backendStatus.message}</span>
          </div>
          
          {!backendStatus.loading && (
            <button onClick={checkBackendConnection} className="retry-button">
              Check Connection
            </button>
          )}
        </div>

        <div className="welcome-content">
          <h2>Welcome to SceneIt!</h2>
          <p>Discover your next favorite movie with personalized recommendations.</p>
          
          {backendStatus.connected && (
            <div className="features">
              <h3>Coming Soon:</h3>
              <ul>
                <li>🎯 Personalized movie recommendations</li>
                <li>🔍 Advanced search and filtering</li>
                <li>⭐ Rate and review movies</li>
                <li>📝 Create watchlists</li>
              </ul>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}

export default App
