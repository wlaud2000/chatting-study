import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchUserInfo, login } from '../api/authApi';
import { User, LoginRequest } from '../types';
import WebSocketService from '../services/websocketService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (data: LoginRequest) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const webSocketService = WebSocketService.getInstance();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      setLoading(true);
      fetchUserInfo()
        .then((response) => {
          if (response.isSuccess && response.result) {
            setUser(response.result);
            setIsAuthenticated(true);
            webSocketService.connect(accessToken);
          } else {
            handleLogout();
          }
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (data: LoginRequest): Promise<boolean> => {
    try {
      const response = await login(data);
      
      if (response.isSuccess && response.result) {
        const { accessToken, refreshToken } = response.result;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        const userResponse = await fetchUserInfo();
        if (userResponse.isSuccess && userResponse.result) {
          setUser(userResponse.result);
          setIsAuthenticated(true);
          webSocketService.connect(accessToken);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    webSocketService.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        logout: handleLogout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};