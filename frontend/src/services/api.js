const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('jarvis_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    if (response.status === 401) {
      // Clear expired credentials and notify auth context without leaking secrets
      localStorage.removeItem('jarvis_token');
      localStorage.removeItem('jarvis_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jarvis:session-expired'));
      }
      throw new Error('Session expired or unauthorized. Please sign in again.');
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Sanitized log: strictly exclude tokens, passwords, or credentials
    const safeEndpoint = endpoint.split('?')[0];
    const isNetworkError = error?.name === 'TypeError' || error?.message?.includes('Failed to fetch');
    const safeMessage = isNetworkError 
      ? 'Network unreachable. Please check your internet connection.' 
      : (error.message || 'Request failed');
    console.warn(`[JARVIS API] ${options.method || 'GET'} ${safeEndpoint} - ${safeMessage}`);
    throw error;
  }
}

export async function getHealthStatus() {
  return apiRequest('/health');
}
