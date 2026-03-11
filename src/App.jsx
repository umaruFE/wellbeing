import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './modules/auth/LoginPage';
import { UnauthorizedPage } from './modules/auth/UnauthorizedPage';
import { MainLayout } from './components/MainLayout';
import { CourseManagementPage } from './modules/course-management/CourseManagementPage';
import { CourseSquarePage } from './modules/course-square/CourseSquarePage';
import { VoiceManagementPage } from './modules/material-management/audio/VoiceManagementPage';
import { SuperAdminPage } from './modules/admin/SuperAdminPage';
import { KnowledgeBasePage } from './modules/material-management/KnowledgeBasePage';
import { PptImageManagement } from './modules/material-management/image/PptImageManagement';
import { IpCharacterManagement } from './modules/material-management/IpCharacterManagement';
import { VideoMaterialManagement } from './modules/material-management/video/VideoMaterialManagement';
import { AccountManagement } from './modules/admin/AccountManagement';

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

            {/* 素材管理子菜单 */}
            <Route
              path="/knowledge-base"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <KnowledgeBasePage />
                </RequireAuth>
              }
            />

            <Route
              path="/ppt-images"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <PptImageManagement />
                </RequireAuth>
              }
            />

            <Route
              path="/ip-characters"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <IpCharacterManagement />
                </RequireAuth>
              }
            />

            <Route
              path="/video-materials"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <VideoMaterialManagement />
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

            <Route
              path="/accounts"
              element={
                <RequireAuth requiredRoles={['super_admin']}>
                  <AccountManagement />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;