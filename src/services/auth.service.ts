import { User } from '../types/user';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const authService = {
  // Redirect to Google OAuth (or dev login in development)
  loginWithGoogle: () => {
    // Check if in development mode
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      // Use dev login endpoint in development
      window.location.href = `${API_URL}/auth/dev-login`;
    } else {
      // Use Google OAuth in production
      window.location.href = `${API_URL}/auth/google`;
    }
  },

  // Get current user session
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include', // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  // Logout
  logout: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }
};
