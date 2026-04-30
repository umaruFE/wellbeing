import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="bg-error-light p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-12 h-12 text-error" />
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">访问被拒绝</h1>
        <p className="text-primary-secondary mb-8">您没有权限访问此页面</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-info text-white rounded-lg hover:bg-info-active flex items-center gap-2 mx-auto transition-colors"
        >
          <Home className="w-4 h-4" />
          返回首页
        </button>
      </div>
    </div>
  );
};


