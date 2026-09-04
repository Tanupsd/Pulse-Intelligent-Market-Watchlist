import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pulse_token');
      localStorage.removeItem('pulse_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password) => api.post('/auth/register', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const watchlistApi = {
  getAll: () => api.get('/watchlists'),
  create: (name) => api.post('/watchlists', { name }),
  getById: (id) => api.get(`/watchlists/${id}`),
  update: (id, name) => api.put(`/watchlists/${id}`, { name }),
  delete: (id) => api.delete(`/watchlists/${id}`),
  addStock: (id, symbol) => api.post(`/watchlists/${id}/stocks`, { symbol }),
  removeStock: (id, symbol) => api.delete(`/watchlists/${id}/stocks/${symbol}`),
  getSummary: (id) => api.get(`/watchlists/${id}/summary`),
  updateCheckpoint: (id) => api.post(`/watchlists/${id}/checkpoint`),
};

export const stocksApi = {
  getDetail: (symbol) => api.get(`/stocks/${symbol}`),
  getChanges: (symbol) => api.get(`/stocks/${symbol}/changes`),
  getHistory: (symbol, range = '1D') => api.get(`/stocks/${symbol}/history?range=${range}`),
  search: (query) => api.get(`/stocks/search?q=${encodeURIComponent(query)}`),
};

export const marketApi = {
  getScenario: () => api.get('/market/scenario'),
  setScenario: (scenario) => api.post('/market/scenario', { scenario }),
  getProvider: () => api.get('/market/provider'),
  setProvider: (mode) => api.post('/market/provider', { mode }),
  setStatus: (status) => api.post('/market/status', { status }),
};

export default api;
