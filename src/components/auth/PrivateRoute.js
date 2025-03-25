import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user has admin role for admin routes
  if (window.location.pathname.startsWith('/admin') && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute; 