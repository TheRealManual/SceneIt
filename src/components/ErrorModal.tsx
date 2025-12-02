import React from 'react';
import './ErrorModal.css';

interface ErrorModalProps {
  onClose: () => void;
  title?: string;
  message?: string;
  icon?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ 
  onClose, 
  title = 'Service Unavailable',
  message = 'The movie database is temporarily unavailable. Please try again in a moment.',
  icon = '⚠️'
}) => {
  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal" onClick={(e) => e.stopPropagation()}>
        <button className="error-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="error-modal-content">
          <div className="error-modal-icon">{icon}</div>
          <h2>{title}</h2>
          <p>{message}</p>
          
          <button className="error-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
