import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LoginPage } from './LoginPage';
import AIGeneratorPage from './AIGeneratorPage.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  const { logout, login } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
              <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                  <h1 className="text-xl font-bold text-slate-800">AI生成器</h1>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </header>
              <AIGeneratorPage />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
