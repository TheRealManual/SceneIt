import React, { useState, useEffect } from 'react';
import { friendsService, User, FriendRequest } from '../services/friends.service';
import './FriendsView.css';

type TabType = 'friends' | 'received' | 'sent' | 'search';

export const FriendsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'friends') {
        const data = await friendsService.getFriendsList();
        setFriends(data.friends);
      } else if (activeTab === 'received') {
        const data = await friendsService.getReceivedRequests();
        setReceivedRequests(data.requests);
      } else if (activeTab === 'sent') {
        const data = await friendsService.getSentRequests();
        setSentRequests(data.requests);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await friendsService.searchUsers(searchQuery);
      setSearchResults(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (friendId: string) => {
    try {
      await friendsService.sendFriendRequest(friendId);
      alert('Friend request sent!');
      setSearchResults(searchResults.filter(u => u._id !== friendId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send request');
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await friendsService.acceptRequest(requestId);
      loadData();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await friendsService.declineRequest(requestId);
      loadData();
    } catch (err) {
      alert('Failed to decline request');
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await friendsService.cancelRequest(requestId);
      loadData();
    } catch (err) {
      alert('Failed to cancel request');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await friendsService.removeFriend(friendId);
      loadData();
    } catch (err) {
      alert('Failed to remove friend');
    }
  };

  return (
    <div className="friends-modal-overlay" onClick={onClose}>
      <div className="friends-modal" onClick={(e) => e.stopPropagation()}>
        <div className="friends-header">
          <h2>Friends</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="friends-tabs">
          <button 
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friends.length})
          </button>
          <button 
            className={activeTab === 'received' ? 'active' : ''}
            onClick={() => setActiveTab('received')}
          >
            Received ({receivedRequests.length})
          </button>
          <button 
            className={activeTab === 'sent' ? 'active' : ''}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Add Friends
          </button>
        </div>

        <div className="friends-content">
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'search' && (
            <div className="search-section">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>Search</button>
              </div>
              
              {loading ? (
                <div className="loading">Searching...</div>
              ) : (
                <div className="user-list">
                  {searchResults.map(user => (
                    <div key={user._id} className="user-card">
                      <img 
                        src={user.profilePhoto || 'https://via.placeholder.com/48'} 
                        alt={user.displayName}
                        className="user-avatar"
                      />
                      <div className="user-info">
                        <div className="user-name">{user.displayName}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                      <button 
                        className="add-friend-btn"
                        onClick={() => sendRequest(user._id)}
                      >
                        Add Friend
                      </button>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery.length >= 2 && !loading && (
                    <div className="no-results">No users found</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="user-list">
              {loading ? (
                <div className="loading">Loading...</div>
              ) : friends.length === 0 ? (
                <div className="no-results">No friends yet</div>
              ) : (
                friends.map(friend => (
                  <div key={friend._id} className="user-card">
                    <img 
                      src={friend.profilePhoto || 'https://via.placeholder.com/48'} 
                      alt={friend.displayName}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <div className="user-name">{friend.displayName}</div>
                      <div className="user-email">{friend.email}</div>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFriend(friend._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="user-list">
              {loading ? (
                <div className="loading">Loading...</div>
              ) : receivedRequests.length === 0 ? (
                <div className="no-results">No pending requests</div>
              ) : (
                receivedRequests.map(request => (
                  <div key={request._id} className="user-card">
                    <img 
                      src={request.user.profilePhoto || 'https://via.placeholder.com/48'} 
                      alt={request.user.displayName}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <div className="user-name">{request.user.displayName}</div>
                      <div className="user-email">{request.user.email}</div>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => acceptRequest(request._id)}
                      >
                        Accept
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => declineRequest(request._id)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="user-list">
              {loading ? (
                <div className="loading">Loading...</div>
              ) : sentRequests.length === 0 ? (
                <div className="no-results">No pending requests</div>
              ) : (
                sentRequests.map(request => (
                  <div key={request._id} className="user-card">
                    <img 
                      src={request.user.profilePhoto || 'https://via.placeholder.com/48'} 
                      alt={request.user.displayName}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <div className="user-name">{request.user.displayName}</div>
                      <div className="user-email">{request.user.email}</div>
                    </div>
                    <button 
                      className="cancel-btn"
                      onClick={() => cancelRequest(request._id)}
                    >
                      Cancel
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};