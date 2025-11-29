import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminExpiry = localStorage.getItem('adminExpiry');

    if (adminToken && adminExpiry) {
      const expiryTime = parseInt(adminExpiry, 10);
      if (Date.now() < expiryTime) {
        setIsAdmin(true);
      } else {
        // Token expired, clear storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminExpiry');
      }
    }

    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Simple authentication - username: admin, password: Greenacres
    // In production, this would validate against Firebase or a secure backend
    if (username === 'admin' && password === 'Greenacres') {
      const token = btoa(`${username}:${Date.now()}`); // Simple token generation
      const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminExpiry', expiry.toString());
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminExpiry');
    setIsAdmin(false);
  };

  const value = {
    isAdmin,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
