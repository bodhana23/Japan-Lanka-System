import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi, employeeAuthApi, User, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginEmployee: (email: string, password: string) => Promise<string>;
  register: (email: string, fullName: string, password: string, phoneNumber?: string) => Promise<void>;
  completeRegistrationAndLogin: (email: string, password: string, fullName: string, phoneNumber?: string | null) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUser: (data: { full_name?: string; phone_number?: string }) => Promise<void>;
  onLoginSuccess?: () => void;
  setOnLoginSuccess: (callback: (() => void) | undefined) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const onLoginSuccessRef = useRef<(() => void) | undefined>(undefined);

  // Check for existing token on app load
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('currentUser');

      if (storedToken) {
        if (isMounted) setToken(storedToken);

        // Parse stored user to check role
        let parsedStoredUser: User | null = null;
        if (storedUser) {
          try {
            parsedStoredUser = JSON.parse(storedUser);
          } catch {
            // Invalid stored user JSON
            parsedStoredUser = null;
          }
        }

        // Only fetch fresh customer data if user is a customer
        // Employee sessions should not call customer APIs
        const isCustomer = parsedStoredUser?.role === 'customer';

        if (isCustomer) {
          // Try to get fresh user data from API (customer only)
          try {
            const userData = await authApi.getMe();
            if (isMounted) {
              setUser(userData);
              localStorage.setItem('currentUser', JSON.stringify(userData));
            }
          } catch (error) {
            if (isMounted) {
              // If token is invalid, use stored user data or clear auth
              if (parsedStoredUser) {
                setUser(parsedStoredUser);
              } else {
                // No stored user and API failed, clear token
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                setToken(null);
                setUser(null);
              }
            }
          }
        } else {
          // For employees (manager, admin, auditor), just use stored user data
          // Do NOT call /auth/customer/me for employees
          if (isMounted && parsedStoredUser) {
            setUser(parsedStoredUser);
          } else if (isMounted) {
            // No stored user for employee session, clear auth
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            setToken(null);
            setUser(null);
          }
        }
      }

      if (isMounted) setIsLoading(false);
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('currentUser', JSON.stringify(response.user));

    // Call the login success callback (e.g., to sync cart)
    if (onLoginSuccessRef.current) {
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        onLoginSuccessRef.current?.();
      }, 100);
    }
  };

  const setOnLoginSuccess = useCallback((callback: (() => void) | undefined) => {
    onLoginSuccessRef.current = callback;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authApi.login(email, password);
    handleAuthResponse(response);
  };

  const loginEmployee = async (email: string, password: string): Promise<string> => {
    // Clear any stale customer session before writing the employee session.
    // Without this, a previously stored role:'customer' in localStorage can
    // survive a failed employee login attempt and redirect the user to '/'.
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');

    const response = await employeeAuthApi.login(email, password);
    const userData: User = {
      id: response.user.id,
      email: response.user.email,
      full_name: response.user.full_name,
      role: response.role.toLowerCase() as User['role'],
      is_active: response.user.is_active,
      created_at: response.user.created_at,
      updated_at: response.user.updated_at,
    };
    setToken(response.access_token);
    setUser(userData);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return response.role.toLowerCase();
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

  const completeRegistrationAndLogin = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string | null
  ): Promise<void> => {
    const response = await authApi.completeRegistration(email, password, fullName, phoneNumber);
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
    loginEmployee,
    register,
    completeRegistrationAndLogin,
    signInWithGoogle,
    logout,
    updateUser,
    onLoginSuccess: onLoginSuccessRef.current,
    setOnLoginSuccess,
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
