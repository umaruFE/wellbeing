import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
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
    // 模拟登录API调用
    // 实际项目中应该调用真实API
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

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

