import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi, User, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string, phoneNumber?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUser: (data: { full_name?: string; phone_number?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('currentUser');

      if (storedToken) {
        setToken(storedToken);

        // Try to get fresh user data from API
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } catch (error) {
          // If token is invalid, use stored user data or clear auth
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              // Invalid stored user, clear everything
              localStorage.removeItem('token');
              localStorage.removeItem('currentUser');
              setToken(null);
              setUser(null);
            }
          } else {
            // No stored user and API failed, clear token
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authApi.login(email, password);
    handleAuthResponse(response);
  };

  const register = async (
    email: string,
    fullName: string,
    password: string,
    phoneNumber?: string
  ): Promise<void> => {
    const response = await authApi.register(email, fullName, password, phoneNumber);
    handleAuthResponse(response);
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      // Open Google Sign-In popup
      const result = await signInWithPopup(auth, googleProvider);

      // Get the Firebase ID token
      const firebaseToken = await result.user.getIdToken();

      // Get user's display name and email from Firebase result
      const displayName = result.user.displayName || '';
      const email = result.user.email || '';

      // Send token, name, and email to backend for verification and JWT generation
      const response = await authApi.googleAuth(firebaseToken, displayName, email);
      handleAuthResponse(response);
    } catch (error: unknown) {
      // Handle specific Firebase errors
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled');
      } else if (firebaseError.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    // Also clear cart on logout
    sessionStorage.removeItem('cart');
  };

  const updateUser = async (data: { full_name?: string; phone_number?: string }): Promise<void> => {
    const updatedUser = await authApi.updateMe(data);
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    signInWithGoogle,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
