import React, { createContext, useContext, useState, useEffect } from 'react';

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
  DRAFT: 'draft',       // 草稿（策划中）
  REVIEW: 'review',     // 待审核
  APPROVED: 'approved', // 已审核
  PUBLISHED: 'published', // 已发布
  ARCHIVED: 'archived'  // 已归档
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
  // 课程管理权限
  COURSE_CREATE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
  COURSE_EDIT: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
  COURSE_DELETE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  COURSE_PUBLISH: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  COURSE_REVIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  COURSE_VIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR, ROLES.VIEWER],

  // 声音管理权限
  VOICE_UPLOAD: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR],
  VOICE_DELETE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER],
  VOICE_VIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR, ROLES.VIEWER],

  // 超级管理端权限
  SUPER_ADMIN_ACCESS: [ROLES.SUPER_ADMIN],

  // 课程广场权限
  COURSE_SQUARE_ACCESS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.RESEARCH_LEADER, ROLES.CREATOR, ROLES.VIEWER]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从localStorage恢复登录状态
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟用户数据
        const mockUsers = {
          'admin': { id: 1, username: 'admin', role: 'super_admin', name: '超级管理员', organizationId: null },
          'org_admin': { id: 2, username: 'org_admin', role: 'org_admin', name: '机构管理员', organizationId: 1, organizationName: '测试机构' },
          'research_leader': { id: 3, username: 'research_leader', role: 'research_leader', name: '教研组长', organizationId: 1, organizationName: '测试机构' },
          'creator': { id: 4, username: 'creator', role: 'creator', name: '课件制作人', organizationId: 1, organizationName: '测试机构' },
          'viewer': { id: 5, username: 'viewer', role: 'viewer', name: '普通老师', organizationId: 1, organizationName: '测试机构' }
        };

        const user = mockUsers[username];
        if (user && password === '123456') {
          const userData = { ...user, token: `mock_token_${Date.now()}` };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('用户名或密码错误'));
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

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

    // 定义 SOP 状态流转规则
    const sopTransitions = {
      [SOP_STATUS.DRAFT]: ['submit_review'],      // 草稿 -> 提交审核
      [SOP_STATUS.REVIEW]: ['approve', 'reject'], // 待审核 -> 通过/驳回
      [SOP_STATUS.APPROVED]: ['publish'],         // 已审核 -> 发布
      [SOP_STATUS.PUBLISHED]: ['unpublish', 'archive'], // 已发布 -> 下架/归档
      [SOP_STATUS.ARCHIVED]: []                   // 已归档 -> 无操作
    };

    // 检查状态是否允许该操作
    const allowedActions = sopTransitions[currentStatus] || [];
    if (!allowedActions.includes(action)) return false;

    // 检查用户角色是否有权限执行该操作
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
