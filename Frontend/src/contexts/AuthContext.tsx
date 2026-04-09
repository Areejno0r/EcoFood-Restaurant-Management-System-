import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api.service';
import { API_CONFIG } from '../config/api.config';
import type { AuthResponse, LoginCredentials, SignupData, Customer } from '../types/api.types';

interface AuthContextType {
  customer: Customer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signup: (userData: SignupData) => Promise<AuthResponse>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'ecofood_access_token',
  REFRESH_TOKEN: 'ecofood_refresh_token',
  CUSTOMER_DATA: 'ecofood_customer_data',
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(customer && accessToken);

  // Load stored authentication data on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const storedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
        const storedRefreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
        const storedCustomerData = localStorage.getItem(TOKEN_STORAGE_KEYS.CUSTOMER_DATA);

        if (storedAccessToken && storedRefreshToken && storedCustomerData) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setCustomer(JSON.parse(storedCustomerData));
          
          // Set token in API service
          apiService.setAuthToken(storedAccessToken);
        }
      } catch (error) {
        console.error('Error loading stored auth data:', error);
        clearStoredAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const storeAuthData = (authData: AuthResponse) => {
    const customerData: Customer = {
      customer_id: authData.customer_id,
      full_name: authData.full_name,
      phone: authData.phone,
      address: '', // Will be loaded separately if needed
      date_joined: new Date().toISOString(), // Placeholder
    };

    // Store in localStorage
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, authData.access_token || '');
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, authData.refresh_token || '');
    localStorage.setItem(TOKEN_STORAGE_KEYS.CUSTOMER_DATA, JSON.stringify(customerData));

    // Update state
    setAccessToken(authData.access_token || null);
    setRefreshToken(authData.refresh_token || null);
    setCustomer(customerData);

    // Set token in API service
    if (authData.access_token) {
      apiService.setAuthToken(authData.access_token);
    }
  };

  const clearStoredAuth = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.CUSTOMER_DATA);

    setAccessToken(null);
    setRefreshToken(null);
    setCustomer(null);

    // Clear token from API service
    apiService.clearAuthToken();
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      storeAuthData(response);
      return response;
    } catch (error) {
      clearStoredAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await apiService.signup(userData);
      storeAuthData(response);
      return response;
    } catch (error) {
      clearStoredAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOKEN_REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.access;

      if (newAccessToken) {
        setAccessToken(newAccessToken);
        localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        apiService.setAuthToken(newAccessToken);
        return newAccessToken;
      }

      throw new Error('No access token in refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  const value: AuthContextType = {
    customer,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 