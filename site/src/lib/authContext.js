"use client";
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get cookies
  const getCookie = useCallback((name) => {
    if (typeof document === 'undefined') return null; // SSR guard
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }, []);

  // Login function
  const login = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    console.log("Login successful, forcing page reload.");
    // window.location.reload();
  }, []);

  // ADD THIS NEW FUNCTION for updating user data without a full login
const updateUserContext = useCallback((newUserData) => {
  setUser(currentUser => ({
    ...currentUser,
    ...newUserData
  }));
}, []);

  // Logout function
  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    // Clear all auth-related cookies
    document.cookie = 'accessTokenClient=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'initialUserData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  }, [router]);

  // Token refresh function
  const refreshAuthToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Important for HttpOnly cookies
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const { accessToken } = await response.json();
      if (!accessToken) throw new Error("No access token received");

      login(accessToken, null); // Set token first
      
      // Fetch user data with new token
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (!userResponse.ok) throw new Error("Failed to fetch user data");
      setUser(await userResponse.json());
      
      return true;
    } catch (err) {
      console.error("Refresh token error:", err);
      logout();
      return false;
    }
  }, [login, logout]);

  // Check for initial auth state (runs once on mount)
  useEffect(() => {
    const checkInitialAuth = async () => {
      setLoading(true);
      
      try {
        // 1. Check for OAuth callback cookies first (Google login)
        const initialUserCookie = getCookie('initialUserData');
        const oauthToken = getCookie('accessTokenClient');
        
        if (oauthToken && initialUserCookie) {
          const userData = JSON.parse(decodeURIComponent(initialUserCookie));
          login(oauthToken, userData);
          
          // Clear temporary cookies
          document.cookie = 'initialUserData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'accessTokenClient=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          return;
        }

        // 2. Check localStorage for existing token
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          const userResponse = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` },
          });
          
          if (userResponse.ok) {
            setAccessToken(storedToken);
            setUser(await userResponse.json());
            return;
          }
          
          // Token might be expired, try to refresh
          await refreshAuthToken();
        }
      } catch (err) {
        console.error("Initial auth check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkInitialAuth();
  }, [getCookie, login, refreshAuthToken]);

  // Intercept fetch requests to add auth headers
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input.url;
      const isAuthRequest = url.includes('/api/auth/');
      const isApiRequest = url.startsWith('/api/');

      // Only intercept API calls that need auth
      if (isApiRequest && !isAuthRequest) {
        let currentToken = accessToken || localStorage.getItem('accessToken');
        const headers = new Headers(init.headers || {});

        if (currentToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${currentToken}`);
        }

        let response = await originalFetch(input, { ...init, headers });

        // Handle 401 Unauthorized
        if (response.status === 401) {
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            currentToken = localStorage.getItem('accessToken');
            headers.set('Authorization', `Bearer ${currentToken}`);
            response = await originalFetch(input, { ...init, headers });
          }
        }

        return response;
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [accessToken, refreshAuthToken]);

  const isProfileIncomplete = user && user.isGoogleLogin && (!user.passoutYear || !user.college);


  const authState = {
    accessToken,
    user,
    loading,
    login,
    updateUserContext,
    logout,
    isAuthenticated: !!accessToken && !!user,
    isProfileIncomplete,
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};