import React from 'react';
import { User } from '../types/user';
import LoginButton from './LoginButton';
import ProfileDropdown from './ProfileDropdown';
import './Header.css';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onViewProfile: () => void;
  onLogin: () => void;
  onLogoClick: () => void;
  onViewLikedMovies?: () => void;
  onViewDislikedMovies?: () => void;
  onPreloadLikedMovies?: () => void;
  onPreloadDislikedMovies?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onViewProfile,
  onLogin,
  onLogoClick,
  onViewLikedMovies,
  onViewDislikedMovies,
  onPreloadLikedMovies,
  onPreloadDislikedMovies
}) => {
  return (
    <header className="App-header">
      <div className="header-content">
        <div className="header-left" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <h1>🎬 SceneIt</h1>
          <p>Find Your Perfect Movie Match</p>
        </div>
        <div className="header-center">
          {user && (
            <>
              <button 
                className="header-nav-btn liked-btn" 
                onClick={onViewLikedMovies}
                onMouseEnter={onPreloadLikedMovies}
              >
                ❤️ Liked Movies
              </button>
              <button 
                className="header-nav-btn disliked-btn" 
                onClick={onViewDislikedMovies}
                onMouseEnter={onPreloadDislikedMovies}
              >
                👎 Disliked Movies
              </button>
            </>
          )}
        </div>
        <div className="header-right">
          {user ? (
            <ProfileDropdown 
              user={user} 
              onLogout={onLogout}
              onViewProfile={onViewProfile}
            />
          ) : (
            <LoginButton onLogin={onLogin} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
