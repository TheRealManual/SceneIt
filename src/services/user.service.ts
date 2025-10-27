const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export interface UserPreferences {
  yearRange: [number, number];
  ratingRange: [number, number];
  genres: string[];
}

export interface Movie {
  movieId: string;
  title: string;
  posterPath: string;
  likedAt?: string;
  dislikedAt?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photo: string;
  preferences: UserPreferences;
  likedMoviesCount: number;
  dislikedMoviesCount: number;
  lastActive: string;
}

export const userService = {
  // Get full user profile with preferences
  getProfile: async (): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  // Update user preferences
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  },

  // Like a movie
  likeMovie: async (movieId: string, title: string, posterPath: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/user/movies/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movieId, title, posterPath }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error liking movie:', error);
      return false;
    }
  },

  // Dislike a movie
  dislikeMovie: async (movieId: string, title: string, posterPath: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/user/movies/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movieId, title, posterPath }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error disliking movie:', error);
      return false;
    }
  },

  // Get liked movies
  getLikedMovies: async (): Promise<Movie[]> => {
    try {
      const response = await fetch(`${API_URL}/api/user/movies/liked`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.likedMovies || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching liked movies:', error);
      return [];
    }
  },

  // Get disliked movies
  getDislikedMovies: async (): Promise<Movie[]> => {
    try {
      const response = await fetch(`${API_URL}/api/user/movies/disliked`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.dislikedMovies || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching disliked movies:', error);
      return [];
    }
  },

  // Remove a liked movie
  removeLikedMovie: async (movieId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/user/movies/liked/${movieId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error removing liked movie:', error);
      return false;
    }
  },
};
