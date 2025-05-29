import { create } from 'zustand';

// Cache store
const useCacheStore = create((set) => ({
  cache: {},
  setCache: (key, data, ttl = 60000) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data,
          timestamp: Date.now(),
          ttl,
        },
      },
    }));
  },
  getCache: (key) => {
    const state = useCacheStore.getState();
    const cached = state.cache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  },
  clearCache: (key) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[key];
      return { cache: newCache };
    });
  },
}));

// Request queue for debouncing
const requestQueue = new Map();
const DEBOUNCE_DELAY = 300;

const debounce = (key, fn) => {
  if (requestQueue.has(key)) {
    clearTimeout(requestQueue.get(key));
  }
  const timeoutId = setTimeout(() => {
    fn();
    requestQueue.delete(key);
  }, DEBOUNCE_DELAY);
  requestQueue.set(key, timeoutId);
};

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  },

  // User related endpoints
  user: {
    async get() {
      const cached = useCacheStore.getState().getCache('user');
      if (cached) return cached;

      const data = await api.request('/user');
      useCacheStore.getState().setCache('user', data, 30000); // Cache for 30 seconds
      return data;
    },
    async login(credentials) {
      const data = await api.request('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      localStorage.setItem('token', data.token);
      return data;
    },
    async register(userData) {
      return api.request('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    async delete() {
      await api.request('/user/delete', { method: 'DELETE' });
      localStorage.removeItem('token');
    },
  },

  // Users management endpoints
  users: {
    async getAll() {
      const cached = useCacheStore.getState().getCache('users');
      if (cached) return cached;

      const data = await api.request('/users');
      useCacheStore.getState().setCache('users', data, 30000); // Cache for 30 seconds
      return data;
    },
    async getAllWithDetails() {
      const cached = useCacheStore.getState().getCache('users_with_details');
      if (cached) return cached;

      const data = await api.request('/users', {
        method: 'POST',
        body: JSON.stringify({ include_details: true })
      });
      useCacheStore.getState().setCache('users_with_details', data, 30000); // Cache for 30 seconds
      return data;
    },
  },

  // Socket related endpoints
  sockets: {
    async getAll() {
      const cached = useCacheStore.getState().getCache('sockets');
      if (cached) return cached;

      const data = await api.request('/sockets', { method: 'POST' });
      useCacheStore.getState().setCache('sockets', data, 15000); // Cache for 15 seconds
      return data;
    },
    async create(socketData) {
      const data = await api.request('/socket/new', {
        method: 'POST',
        body: JSON.stringify(socketData),
      });
      useCacheStore.getState().clearCache('sockets');
      return data;
    },
    async delete(socketId) {
      await api.request(`/socket/delete/${socketId}`, { method: 'DELETE' });
      useCacheStore.getState().clearCache('sockets');
    },
    async deleteAll() {
      await api.request('/sockets/delete-all', { method: 'DELETE' });
      useCacheStore.getState().clearCache('sockets');
    },
  },

  // Session related endpoints
  sessions: {
    async start(userId, socketId) {
      const data = await api.request(`/${userId}/socket/start/${socketId}`, {
        method: 'POST',
        body: JSON.stringify({ socket_id: socketId }),
      });
      useCacheStore.getState().clearCache('sockets');
      return data;
    },
    async stop(userId, socketId) {
      const data = await api.request(`/${userId}/socket/stop/${socketId}`, {
        method: 'POST',
        body: JSON.stringify({ socket_id: socketId }),
      });
      useCacheStore.getState().clearCache('sockets');
      return data;
    },
  },

  /* Commented out notifications related endpoints
  // Notifications related endpoints
  notifications: {
    async get(userId) {
      const cached = useCacheStore.getState().getCache(`notifications_${userId}`);
      if (cached) return cached;

      const data = await api.request(`/${userId}/notifications`);
      useCacheStore.getState().setCache(`notifications_${userId}`, data, 5000); // Cache for 5 seconds
      return data;
    },
    async clear(userId) {
      await api.request(`/${userId}/notifications/clear`, { method: 'DELETE' });
      useCacheStore.getState().clearCache(`notifications_${userId}`);
    },
  },
  */

  // Status related endpoints
  status: {
    async check(endpoint) {
      const cached = useCacheStore.getState().getCache(`status_${endpoint}`);
      if (cached) return cached;

      const data = await api.request(`/health/${endpoint}`);
      useCacheStore.getState().setCache(`status_${endpoint}`, data, 25000); // Cache for 25 seconds
      return data;
    },
  },
};

export default api; 