import { useState, useEffect } from 'react';
import './MovieModal.css';
import RatingModal from './RatingModal';
import StarRating from './StarRating';
import { friendsService, User } from '../services/friends.service';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  overview: string;
  releaseDate?: string;
  genres?: Array<{ id: number; name: string }>;
  voteAverage?: number;
  runtime?: number;
  videos?: Array<{
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
  }>;
  watchProviders?: {
    link?: string;
    flatrate?: Array<{
      providerId: number;
      providerName: string;
      logoPath: string;
    }>;
    rent?: Array<{
      providerId: number;
      providerName: string;
      logoPath: string;
    }>;
    buy?: Array<{
      providerId: number;
      providerName: string;
      logoPath: string;
    }>;
  };
}

interface MovieModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  onLike: (movie: Movie) => void;
  onDislike: (movie: Movie) => void;
  onFavorite?: (movie: Movie) => void;
  onWatch?: (movie: Movie, rating: number) => void;
  onUnwatch?: (movieId: string) => void;
  onUpdateWatchedRating?: (movieId: string, rating: number) => void;
  isFavorited?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  userRating?: number;
  averageRating?: number;
}

const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  isOpen,
  onClose,
  onLike,
  onDislike,
  onFavorite,
  onWatch,
  onUnwatch,
  onUpdateWatchedRating,
  isFavorited = false,
  isLiked = false,
  isDisliked = false,
  userRating,
  averageRating
}) => {
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localIsDisliked, setLocalIsDisliked] = useState(isDisliked);
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [localUserRating, setLocalUserRating] = useState(userRating);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoveredWatchedButton, setHoveredWatchedButton] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [shareMode, setShareMode] = useState<'friend' | 'email'>('friend');
  const [showWatchProviders, setShowWatchProviders] = useState(false);

  // Prevent body scroll when modal is open and scroll to top
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Sync local state with props when they change
  useEffect(() => {
    setLocalIsLiked(isLiked);
    setLocalIsDisliked(isDisliked);
    setLocalIsFavorited(isFavorited);
    setLocalUserRating(userRating);
  }, [isLiked, isDisliked, isFavorited, userRating]);

  if (!isOpen) return null;

  console.log('🎬 Modal opened with movie:', movie.title);
  console.log('🖼️ Movie posterPath:', movie.posterPath);
  console.log('📊 Movie data:', movie);

  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  console.log('🖼️ Final poster URL:', posterUrl);

  const handleLike = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onLike(movie);
    setLocalIsLiked(true);
    setIsProcessing(false);
  };

  const handleDislike = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onDislike(movie);
    setLocalIsDisliked(true);
    setIsProcessing(false);
  };

  const handleFavorite = async () => {
    if (!onFavorite || isProcessing) return;
    setIsProcessing(true);
    await onFavorite(movie);
    setLocalIsFavorited(!localIsFavorited);
    setIsProcessing(false);
  };

  const handleWatchClick = () => {
    // Show modal to add or update rating
    setShowRatingModal(true);
  };

  const handleUnwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnwatch && localUserRating) {
      onUnwatch(movie.tmdbId.toString());
      setLocalUserRating(undefined);
    }
  };

  const handleRatingSubmit = (rating: number, preference?: 'like' | 'dislike') => {
    if (localUserRating && onUpdateWatchedRating) {
      // Update existing rating
      onUpdateWatchedRating(movie.tmdbId.toString(), rating);
      setLocalUserRating(rating);
    } else if (onWatch) {
      // Add new watched movie
      onWatch(movie, rating);
      setLocalUserRating(rating);
      
      // Handle preference selection if provided
      if (preference === 'like' && !localIsLiked && !localIsDisliked) {
        onLike(movie);
        setLocalIsLiked(true);
      } else if (preference === 'dislike' && !localIsLiked && !localIsDisliked) {
        onDislike(movie);
        setLocalIsDisliked(true);
      }
    }
    setShowRatingModal(false);
  };

  const handleRatingCancel = () => {
    setShowRatingModal(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = () => {
    onClose();
  };

  const handleShareClick = async () => {
    setShowShareDialog(true);
    setShareEmail('');
    setShareMessage('');
    setShareError('');
    setShareSuccess(false);
    setSelectedFriend('');
    
    // Fetch friends list
    try {
      const { friends: friendsList } = await friendsService.getFriendsList();
      setFriends(friendsList);
      if (friendsList.length > 0) {
        setShareMode('friend');
      } else {
        setShareMode('email');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
      setShareMode('email');
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError('');
    setShareLoading(true);

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      // Determine recipient email
      let recipientEmail = shareEmail;
      if (shareMode === 'friend' && selectedFriend) {
        const friend = friends.find(f => f._id === selectedFriend);
        if (friend) {
          recipientEmail = friend.email;
        } else {
          setShareError('Please select a friend');
          setShareLoading(false);
          return;
        }
      } else if (shareMode === 'email' && !shareEmail) {
        setShareError('Please enter an email address');
        setShareLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/movies/${movie.tmdbId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipientEmail,
          personalMessage: shareMessage,
        }),
      });

      if (response.ok) {
        setShareSuccess(true);
        setTimeout(() => {
          setShowShareDialog(false);
          setShareSuccess(false);
        }, 2000);
      } else {
        const error = await response.json();
        setShareError(error.error || 'Failed to send email');
      }
    } catch (error) {
      setShareError('Network error. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  // Get trailer video (prefer official trailers)
  const trailer = movie.videos?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  ) || movie.videos?.find((v) => v.type === 'Trailer' && v.site === 'YouTube');

  // Get all streaming providers (US region)
  const streamingProviders = movie.watchProviders?.US?.flatrate || movie.watchProviders?.flatrate || [];
  const rentProviders = movie.watchProviders?.US?.rent || movie.watchProviders?.rent || [];
  const buyProviders = movie.watchProviders?.US?.buy || movie.watchProviders?.buy || [];
  const hasProviders = streamingProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0;

  return (
    <div className="movie-modal-overlay" onClick={handleBackdropClick}>
      <div className="movie-modal-content" onClick={handleContentClick}>
        <button className="modal-close-btn" onClick={handleClose}>
          ✕
        </button>

        <div className="modal-movie-card">
          {/* Where to Watch Button - Top Left */}
          {hasProviders && (
            <div className="modal-watch-button-container">
              <button
                className="modal-watch-button"
                onClick={() => setShowWatchProviders(!showWatchProviders)}
                title="Where to watch"
              >
                <span className="modal-btn-icon">📺</span>
              </button>
              
              {/* Dropdown */}
              {showWatchProviders && (
                <div className="modal-watch-dropdown">
                  <h4 className="modal-watch-dropdown-title">Where to Watch</h4>
                  
                  {streamingProviders.length > 0 && (
                    <div className="modal-provider-category">
                      <div className="modal-provider-label">Stream</div>
                      <div className="modal-provider-grid">
                        {streamingProviders.map((provider: any) => (
                          <a
                            key={provider.providerId}
                            href={provider.directUrl || movie.watchProviders?.US?.link || movie.watchProviders?.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-provider-item"
                            title={provider.providerName}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logoPath}`}
                              alt={provider.providerName}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {rentProviders.length > 0 && (
                    <div className="modal-provider-category">
                      <div className="modal-provider-label">Rent</div>
                      <div className="modal-provider-grid">
                        {rentProviders.map((provider: any) => (
                          <a
                            key={provider.providerId}
                            href={provider.directUrl || movie.watchProviders?.US?.link || movie.watchProviders?.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-provider-item"
                            title={provider.providerName}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logoPath}`}
                              alt={provider.providerName}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {buyProviders.length > 0 && (
                    <div className="modal-provider-category">
                      <div className="modal-provider-label">Buy</div>
                      <div className="modal-provider-grid">
                        {buyProviders.map((provider: any) => (
                          <a
                            key={provider.providerId}
                            href={provider.directUrl || movie.watchProviders?.US?.link || movie.watchProviders?.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-provider-item"
                            title={provider.providerName}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logoPath}`}
                              alt={provider.providerName}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Share Button - Top Left */}
          <button
            className="modal-share-button"
            onClick={handleShareClick}
            title="Share this movie"
          >
            <span className="modal-btn-icon">✉️</span>
          </button>

          {/* Dislike Button - Top Left (next to share) */}
          <button
            className={`modal-dislike-button ${localIsDisliked ? 'disliked' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleDislike}
            disabled={isProcessing || localIsDisliked}
            title="Dislike this movie"
          >
            <span className="modal-btn-icon">👎</span>
          </button>

          {/* Like Button - Top Right */}
          <button
            className={`modal-like-button ${localIsLiked ? 'liked' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleLike}
            disabled={isProcessing || localIsLiked}
            title="Like this movie"
          >
            <span className="modal-btn-icon">👍</span>
          </button>

          {/* Favorite Button - Bottom Right (only shows if movie is liked) */}
          {localIsLiked && onFavorite && (
            <button
              className={`modal-favorite-button ${localIsFavorited ? 'favorited' : ''} ${isProcessing ? 'processing' : ''}`}
              onClick={handleFavorite}
              disabled={isProcessing}
              title={localIsFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className="modal-fav-icon">{localIsFavorited ? '❤️' : '🤍'}</span>
            </button>
          )}

          {/* Watched Button - Bottom Right, moves left when favorite shows */}
          <button
            className={`modal-watched-button ${localUserRating ? 'watched' : ''}`}
            onClick={(e) => localUserRating ? handleUnwatchClick(e) : handleWatchClick()}
            onMouseEnter={() => setHoveredWatchedButton(true)}
            onMouseLeave={() => setHoveredWatchedButton(false)}
            title={localUserRating ? 'Click to unwatch' : 'Mark as watched'}
          >
            <span className="modal-watched-icon">🎬</span>
            <div className={`rating-wrapper ${localUserRating || (hoveredWatchedButton && averageRating) ? 'show' : ''}`}>
              {localUserRating ? (
                <StarRating rating={localUserRating} size="small" />
              ) : hoveredWatchedButton && averageRating ? (
                <StarRating rating={averageRating} size="small" />
              ) : null}
            </div>
          </button>

          <div className="modal-movie-poster">
            <img 
              src={posterUrl}
              alt={movie.title}
              onError={(e) => {
                console.error('❌ Failed to load poster:', posterUrl);
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Poster';
              }}
              onLoad={() => console.log('✅ Poster loaded successfully:', posterUrl)}
            />
          </div>

          <div className="modal-movie-info">
            <h2 className="modal-movie-title">{movie.title}</h2>
            
            <div className="modal-movie-meta">
              {movie.releaseDate && (
                <span className="modal-meta-item">
                  📅 {new Date(movie.releaseDate).getFullYear()}
                </span>
              )}
              {movie.runtime && (
                <span className="modal-meta-item">
                  ⏱️ {movie.runtime}min
                </span>
              )}
              {movie.voteAverage && (
                <span className="modal-meta-item">
                  ⭐ {movie.voteAverage.toFixed(1)}
                </span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="modal-movie-genres">
                {movie.genres.slice(0, 3).map(genre => (
                  <span key={genre.id} className="modal-genre-tag">{genre.name}</span>
                ))}
              </div>
            )}

            <p className="modal-movie-overview">{movie.overview}</p>

            {/* Trailer Section */}
            {trailer && (
              <div className="modal-trailer-section">
                <h3 className="modal-section-title">🎬 Trailer</h3>
                <div className="modal-trailer-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    title={trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Rating Modal - inside card for proper positioning */}
          {showRatingModal && (
            <div className="nested-rating-modal-container">
              <RatingModal
                movieTitle={movie.title}
                initialRating={localUserRating}
                onSubmit={handleRatingSubmit}
                onClose={handleRatingCancel}
                showPreference={!localIsLiked && !localIsDisliked}
              />
            </div>
          )}

          {/* Share Dialog */}
          {showShareDialog && (
            <div className="modal-share-dialog-overlay" onClick={() => setShowShareDialog(false)}>
              <div className="modal-share-dialog" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-share-dialog-close"
                  onClick={() => setShowShareDialog(false)}
                >
                  ✕
                </button>

                <h3 className="modal-share-dialog-title">✉️ Share "{movie.title}"</h3>

                {shareSuccess ? (
                  <div className="modal-share-success">
                    <span className="modal-share-success-icon">✅</span>
                    <p>Email sent successfully!</p>
                  </div>
                ) : (
                  <form onSubmit={handleShareSubmit} className="modal-share-form">
                    {/* Mode Toggle */}
                    {friends.length > 0 && (
                      <div className="modal-share-mode-toggle">
                        <button
                          type="button"
                          className={`modal-share-mode-btn ${shareMode === 'friend' ? 'active' : ''}`}
                          onClick={() => setShareMode('friend')}
                        >
                          Select Friend
                        </button>
                        <button
                          type="button"
                          className={`modal-share-mode-btn ${shareMode === 'email' ? 'active' : ''}`}
                          onClick={() => setShareMode('email')}
                        >
                          Enter Email
                        </button>
                      </div>
                    )}

                    {/* Friend Selector */}
                    {shareMode === 'friend' ? (
                      <div className="modal-share-field">
                        <label htmlFor="friendSelect">Select Friend</label>
                        <select
                          id="friendSelect"
                          value={selectedFriend}
                          onChange={(e) => setSelectedFriend(e.target.value)}
                          required
                          disabled={shareLoading}
                          className="modal-share-select"
                        >
                          <option value="">Choose a friend...</option>
                          {friends.map((friend) => (
                            <option key={friend._id} value={friend._id}>
                              {friend.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="modal-share-field">
                        <label htmlFor="shareEmail">Recipient Email</label>
                        <input
                          id="shareEmail"
                          type="email"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          placeholder="friend@example.com"
                          required
                          disabled={shareLoading}
                        />
                      </div>
                    )}

                    <div className="modal-share-field">
                      <label htmlFor="shareMessage">Personal Message (Optional)</label>
                      <textarea
                        id="shareMessage"
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="I think you'll love this movie!"
                        rows={3}
                        disabled={shareLoading}
                      />
                    </div>

                    {shareError && (
                      <div className="modal-share-error">{shareError}</div>
                    )}

                    <button
                      type="submit"
                      className="modal-share-submit"
                      disabled={shareLoading}
                    >
                      {shareLoading ? 'Sending...' : 'Send Recommendation'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
