import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// 角色定义
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  RESEARCH_LEADER: 'research_leader',
  CREATOR: 'creator',
  VIEWER: 'viewer'
};

// 角色名称映射
export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: '超级管理员',
  [ROLES.ORG_ADMIN]: '机构管理员',
  [ROLES.RESEARCH_LEADER]: '教研组长',
  [ROLES.CREATOR]: '课件制作人',
  [ROLES.VIEWER]: '普通老师'
};

// SOP 状态定义
export const SOP_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// SOP 状态名称映射
export const SOP_STATUS_NAMES = {
  [SOP_STATUS.DRAFT]: '草稿',
  [SOP_STATUS.REVIEW]: '待审核',
  [SOP_STATUS.APPROVED]: '已审核',
  [SOP_STATUS.PUBLISHED]: '已发布',
  [SOP_STATUS.ARCHIVED]: '已归档'
};

// 权限配置
export const PERMISSIONS = {
  COURSE_CREATE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
  COURSE_EDIT: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
  COURSE_DELETE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  COURSE_PUBLISH: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  COURSE_REVIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  COURSE_VIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR, ROLES.VIEWER],

  VOICE_UPLOAD: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
  VOICE_DELETE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  VOICE_VIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR, ROLES.VIEWER],

  SUPER_ADMIN_ACCESS: [ROLES.SUPER_ADMIN],

  COURSE_SQUARE_ACCESS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR, ROLES.VIEWER]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // 使用相对路径，通过 Vite 代理转发到后端
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      const userData = {
        ...data.user,
        token: data.token
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  // 检查是否有指定角色
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  // 检查是否有指定权限
  const hasPermission = (permission) => {
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  };

  // 检查是否可以执行 SOP 操作
  const canExecuteSOPAction = (action, currentStatus) => {
    if (!user) return false;

    const sopTransitions = {
      [SOP_STATUS.DRAFT]: ['submit_review'],
      [SOP_STATUS.REVIEW]: ['approve', 'reject'],
      [SOP_STATUS.APPROVED]: ['publish'],
      [SOP_STATUS.PUBLISHED]: ['unpublish', 'archive'],
      [SOP_STATUS.ARCHIVED]: []
    };

    const allowedActions = sopTransitions[currentStatus] || [];
    if (!allowedActions.includes(action)) return false;

    const actionPermissions = {
      submit_review: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
      approve: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
      reject: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
      publish: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
      unpublish: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
      archive: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER]
    };

    const allowedRoles = actionPermissions[action] || [];
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    hasRole,
    hasPermission,
    canExecuteSOPAction,
    ROLES,
    ROLE_NAMES,
    SOP_STATUS,
    SOP_STATUS_NAMES,
    PERMISSIONS
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
