import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoading } from './PageLoading';

export const RequireAuth = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <PageLoading layout="viewport" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// 权限检查组件
export const RequirePermission = ({ children, permission }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <PageLoading layout="viewport" />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
