import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  profilePicture?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si on reçoit une erreur 401 (Non autorisé)
    if (error.response?.status === 401) {
      // On supprime le token pourri
      localStorage.removeItem('token');
      
      // On redirige vers le login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/api/auth/profile');
    return response.data.user;
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

export default api;
