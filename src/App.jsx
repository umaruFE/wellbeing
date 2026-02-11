import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { MainLayout } from './components/MainLayout';
import { CourseManagementPage } from './pages/course/CourseManagementPage';
import { CourseSquarePage } from './pages/course/CourseSquarePage';
import { VoiceManagementPage } from './pages/admin/VoiceManagementPage';
import { SuperAdminPage } from './pages/admin/SuperAdminPage';
import { KnowledgeBasePage } from './pages/course/KnowledgeBasePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* 首页 - Dashboard */}
            <Route
              path="/"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'viewer']}>
                  <div />
                </RequireAuth>
              }
            />

            {/* 创建课程页面 */}
            <Route
              path="/create"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <div />
                </RequireAuth>
              }
            />

            <Route
              path="/courses"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <CourseManagementPage />
                </RequireAuth>
              }
            />

            <Route
              path="/course-square"
              element={<CourseSquarePage />}
            />

            <Route
              path="/voices"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <VoiceManagementPage />
                </RequireAuth>
              }
            />

            <Route
              path="/knowledge-base"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <KnowledgeBasePage />
                </RequireAuth>
              }
            />

            <Route
              path="/super-admin"
              element={
                <RequireAuth requiredRoles={['super_admin']}>
                  <SuperAdminPage />
                </RequireAuth>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
