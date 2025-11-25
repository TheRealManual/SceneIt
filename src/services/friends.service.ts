const API_URL = import.meta.env.VITE_API_URL;

export interface User {
  _id: string;
  displayName: string;
  email: string;
  photo?: string;
}

export interface FriendRequest {
  _id: string;
  user: User;
  createdAt: string;
}

export const friendsService = {
  async searchUsers(query: string): Promise<{ users: User[] }> {
    const response = await fetch(
      `${API_URL}/api/friends/search?query=${encodeURIComponent(query)}`,
      { credentials: 'include' }
    );
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  async sendFriendRequest(friendId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ friendId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send request');
    }
  },

  async getFriendsList(): Promise<{ friends: User[] }> {
    const response = await fetch(`${API_URL}/api/friends/list`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to get friends');
    return response.json();
  },

  async getReceivedRequests(): Promise<{ requests: FriendRequest[] }> {
    const response = await fetch(`${API_URL}/api/friends/requests/received`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to get received requests');
    return response.json();
  },

  async getSentRequests(): Promise<{ requests: FriendRequest[] }> {
    const response = await fetch(`${API_URL}/api/friends/requests/sent`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to get sent requests');
    return response.json();
  },

  async acceptRequest(requestId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/friends/request/${requestId}/accept`,
      { method: 'POST', credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to accept request');
  },

  async declineRequest(requestId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/friends/request/${requestId}/decline`,
      { method: 'POST', credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to decline request');
  },

  async cancelRequest(requestId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/friends/request/${requestId}/cancel`,
      { method: 'DELETE', credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to cancel request');
  },

  async removeFriend(friendId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/friends/remove/${friendId}`,
      { method: 'DELETE', credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to remove friend');
  }
};