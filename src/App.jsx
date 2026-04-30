import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './modules/auth/LoginPage';
import { UnauthorizedPage } from './modules/auth/UnauthorizedPage';
import { MainLayout } from './components/MainLayout';
import { CourseManagementPage } from './modules/course-management/CourseManagementPage';
import CourseOverviewPage from './modules/course-management/course-overview/CourseOverviewPage';
import LessonPlanPage from './modules/course-management/lesson-plan/LessonPlanPage';
import { CanvasView } from './modules/course-management/ppt-canvas/CanvasView';
import { ReadingMaterialCanvasView } from './modules/course-management/reading-material/ReadingMaterialCanvasView';
import CreateCoursePage from './modules/course-management/create-course/CreateCoursePage';
import { CourseSquarePage } from './modules/course-square/CourseSquarePage';
import { VoiceManagementPage } from './modules/material-management/audio/VoiceManagementPage';
import { AudioGeneratorPage } from './modules/test/AudioGeneratorPage';
import { SuperAdminPage } from './modules/admin/SuperAdminPage';
import { KnowledgeBasePage } from './modules/material-management/KnowledgeBasePage';
import { PptImageManagement } from './modules/material-management/image/PptImageManagement';
import { IpCharacterManagement } from './modules/material-management/IpCharacterManagement';
import { VideoMaterialManagement } from './modules/material-management/video/VideoMaterialManagement';
import { AccountManagement } from './modules/admin/AccountManagement';
import IPSceneTestPage from './modules/test/IPSceneTestPage';
import { VideoGeneratorPage } from './modules/test/VideoGeneratorPage';
import { VoiceGeneratorPage } from './modules/test/VoiceGeneratorPage';

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
                  <CreateCoursePage />
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
              path="/courses/:courseId/overview"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <CourseOverviewPage />
                </RequireAuth>
              }
            />

            <Route
              path="/courses/:courseId/lesson-plan"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <LessonPlanPage />
                </RequireAuth>
              }
            />

            <Route
              path="/courses/:courseId/ppt"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <CanvasView initialConfig={{ courseId: 'temp' }} />
                </RequireAuth>
              }
            />

            <Route
              path="/courses/:courseId/reading"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <ReadingMaterialCanvasView initialConfig={{ courseId: 'temp' }} />
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
              path="/audio-generator"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <AudioGeneratorPage />
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

            <Route
              path="/test/ip-scene"
              element={<IPSceneTestPage />}
            />

            <Route
              path="/test/video-generator"
              element={<VideoGeneratorPage />}
            />

            <Route
              path="/test/voice-generator"
              element={<VoiceGeneratorPage />}
            />

            <Route
              path="/test/audio-generator"
              element={<AudioGeneratorPage />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;