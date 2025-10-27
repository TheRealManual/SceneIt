import { useState, useRef, useEffect } from 'react';
import { User } from '../types/user';
import './ProfileDropdown.css';

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
  onViewProfile: () => void;
}

function ProfileDropdown({ user, onLogout, onViewProfile }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button 
        className="profile-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile menu"
      >
        <img 
          src={user.photo || 'https://via.placeholder.com/40'} 
          alt={user.displayName}
          className="profile-avatar"
        />
        <span className="profile-name">{user.displayName}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 9L1 4h10z" />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <button 
            className="dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onViewProfile();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            View Profile
          </button>
          <button 
            className="dropdown-item logout"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2h8v2H3v8h8v2H3a2 2 0 01-2-2V4a2 2 0 012-2zm9 3l4 3-4 3V8H6V6h6V5z" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
