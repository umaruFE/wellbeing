import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoading } from './PageLoading';

export const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoading layout="viewport" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search + location.hash }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


