import { apiRequest } from './api';

export const authService = {
  async register(fullName, email, password, confirmPassword) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
      }),
    });
    if (data.access_token) {
      localStorage.setItem('jarvis_token', data.access_token);
      localStorage.setItem('jarvis_user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      localStorage.setItem('jarvis_token', data.access_token);
      localStorage.setItem('jarvis_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getCurrentUser() {
    return await apiRequest('/auth/me');
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('jarvis_token');
      localStorage.removeItem('jarvis_user');
    }
  },

  getStoredUser() {
    try {
      const userStr = localStorage.getItem('jarvis_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('jarvis_token');
  },
};
