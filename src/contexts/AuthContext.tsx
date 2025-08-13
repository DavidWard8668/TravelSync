import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'master' | 'client';
  phone?: string;
  created_at: string;
  last_active: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'master' | 'client';
  phone?: string;
  invitationCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('secondChance_token');
        const savedUser = localStorage.getItem('secondChance_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Verify token is still valid
          try {
            await refreshToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth data
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('secondChance_token', data.token);
      localStorage.setItem('secondChance_user', JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user.name}!`, {
        description: `Logged in as ${data.user.role === 'master' ? 'Recovery Support Person' : 'Recovery Client'}`
      });

    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store auth data
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('secondChance_token', data.token);
      localStorage.setItem('secondChance_user', JSON.stringify(data.user));

      toast.success(`Welcome to Second Chance, ${data.user.name}!`, {
        description: `Account created as ${data.user.role === 'master' ? 'Recovery Support Person' : 'Recovery Client'}`
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      // Update auth data
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('secondChance_token', data.token);
      localStorage.setItem('secondChance_user', JSON.stringify(data.user));

    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('secondChance_token');
    localStorage.removeItem('secondChance_user');
    
    toast.success('Logged out successfully', {
      description: 'Stay safe and take care of yourself'
    });
  };

  // Auto-refresh token every 6 days (token expires in 7 days)
  useEffect(() => {
    if (token) {
      const refreshInterval = setInterval(() => {
        refreshToken().catch(() => {
          // If refresh fails, user will be logged out automatically
        });
      }, 6 * 24 * 60 * 60 * 1000); // 6 days

      return () => clearInterval(refreshInterval);
    }
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for API requests with authentication
export function useAuthenticatedFetch() {
  const { token, logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // If token is invalid, logout user
    if (response.status === 401) {
      logout();
      throw new Error('Authentication expired. Please log in again.');
    }

    return response;
  };

  return authenticatedFetch;
}

export default AuthContext;