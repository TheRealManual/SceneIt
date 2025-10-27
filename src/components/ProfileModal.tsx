import { User } from '../types/user';
import './ProfileModal.css';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

function ProfileModal({ user, onClose }: ProfileModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="profile-modal-header">
          <img 
            src={user.photo || 'https://via.placeholder.com/120'} 
            alt={user.displayName}
            className="profile-modal-avatar"
          />
          <h2 className="profile-modal-name">{user.displayName}</h2>
        </div>

        <div className="profile-modal-body">
          <div className="profile-info-section">
            <h3>Account Information</h3>
            
            <div className="profile-info-item">
              <span className="profile-info-label">User ID:</span>
              <span className="profile-info-value">{user.id}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Display Name:</span>
              <span className="profile-info-value">{user.displayName}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Email:</span>
              <span className="profile-info-value">{user.email || 'Not provided'}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Authentication Provider:</span>
              <span className="profile-info-value">
                <div className="provider-badge">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Google
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
