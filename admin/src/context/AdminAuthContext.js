// context/AdminAuthContext.js
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Import js-cookie

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null);
  const [adminUser, setAdminUser] = useState(null); // Renamed to adminUser for clarity
  const [loading, setLoading] = useState(true);

  // Admin Login function
  const adminLogin = useCallback((token, userData) => {
    setAccessToken(token);
    setAdminUser(userData);
    // Store access token in localStorage for immediate client-side use (optional, but convenient)
    localStorage.setItem('adminAccessToken', token);
    // The HttpOnly refresh token is set by the backend, we don't handle it here directly
  }, []);

  // Admin Logout function
  const adminLogout = useCallback(async () => {
    setLoading(true);
    try {
      // Call backend logout API to clear HttpOnly cookie
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important to send cookies
      });
    } catch (error) {
      console.error("Error calling admin logout API:", error);
      // Continue with local logout even if API fails
    } finally {
      setAccessToken(null);
      setAdminUser(null);
      localStorage.removeItem('adminAccessToken');
      // Clear any client-accessible cookies if set (e.g., adminAccessTokenClient)
      Cookies.remove('adminAccessTokenClient', { path: '/' });
      Cookies.remove('admin_refreshToken', { path: '/api/admin/auth/refresh-token' }); // Ensure client-side knows it's gone
      setLoading(false);
      router.push('/'); // Redirect to admin login page
    }
  }, [router]);

  // Admin Token Refresh function
  const refreshAdminAuthToken = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for HttpOnly cookies
      });

      if (!response.ok) {
        throw new Error("Failed to refresh admin token");
      }

      const { accessToken: newAccessToken } = await response.json();
      if (!newAccessToken) throw new Error("No new access token received");

      // Fetch admin user data with new token
      const adminUserResponse = await fetch('/api/admin/auth/me', {
        headers: { 'Authorization': `Bearer ${newAccessToken}` },
      });

      if (!adminUserResponse.ok) throw new Error("Failed to fetch admin user data after refresh");
      const newAdminUserData = await adminUserResponse.json();

      adminLogin(newAccessToken, newAdminUserData); // Update context with new tokens and user data
      return true;
    } catch (err) {
      console.error("Admin Refresh token error:", err);
      adminLogout(); // Log out if refresh fails
      return false;
    }
  }, [adminLogin, adminLogout]);

  // Initial authentication check (runs once on mount)
  useEffect(() => {
    const checkInitialAdminAuth = async () => {
      setLoading(true);
      try {
        const storedAccessToken = localStorage.getItem('adminAccessToken');
        const adminRefreshTokenCookie = Cookies.get('admin_refreshToken');

        if (storedAccessToken) {
          // Attempt to fetch user data with stored access token
          const adminUserResponse = await fetch('/api/admin/auth/me', {
            headers: { 'Authorization': `Bearer ${storedAccessToken}` },
          });

          if (adminUserResponse.ok) {
            setAccessToken(storedAccessToken);
            setAdminUser(await adminUserResponse.json());
            return; // Successfully authenticated
          }
        }

        // If access token is invalid/missing, try refreshing with HttpOnly refresh token
        if (adminRefreshTokenCookie) {
          await refreshAdminAuthToken();
        } else {
          // No tokens found, not authenticated
          setAccessToken(null);
          setAdminUser(null);
        }
      } catch (err) {
        console.error("Initial admin auth check error:", err);
        setAccessToken(null);
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkInitialAdminAuth();
  }, [refreshAdminAuthToken]);

  // Intercept fetch requests to add auth headers and handle 401s for admin APIs
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input.url;
      const isAdminApiRequest = url.startsWith('/api/admin/');
      const isAuthApiRequest = url.includes('/api/admin/auth/'); // Exclude auth APIs from token injection/refresh loop

      if (isAdminApiRequest && !isAuthApiRequest) {
        let currentToken = accessToken || localStorage.getItem('adminAccessToken');
        const headers = new Headers(init.headers || {});

        if (currentToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${currentToken}`);
        }

        let response = await originalFetch(input, { ...init, headers });

        // Handle 401 Unauthorized for admin APIs
        if (response.status === 401) {
          console.warn("Admin API returned 401, attempting token refresh...");
          const refreshed = await refreshAdminAuthToken();
          if (refreshed) {
            // Retry the original request with the new token
            currentToken = localStorage.getItem('adminAccessToken');
            headers.set('Authorization', `Bearer ${currentToken}`);
            response = await originalFetch(input, { ...init, headers });
          }
        }
        return response;
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch; // Restore original fetch on unmount
    };
  }, [accessToken, refreshAdminAuthToken]);


  const isAdminAuthenticated = !!accessToken && !!adminUser;

  const authState = {
    accessToken,
    adminUser,
    loading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated,
    // Add any other derived states needed, e.g., isSuperadmin, isUniadmin
    isSuperadmin: isAdminAuthenticated && adminUser?.role === 'superadmin',
    isUniadmin: isAdminAuthenticated && adminUser?.role === 'uniadmin',
  };

  return (
    <AdminAuthContext.Provider value={authState}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};