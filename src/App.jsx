import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ROLES, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './modules/auth/LoginPage';
import { UnauthorizedPage } from './modules/auth/UnauthorizedPage';

import { Layout } from './figma-restore/Layout';
import { CourseSquarePage } from './modules/course-square/CourseSquarePage';
import { AudioGeneratorPage } from './modules/test/AudioGeneratorPage';
import { SuperAdminPage } from './modules/admin/SuperAdminPage';
import { KnowledgeBasePage } from './modules/material-management/KnowledgeBasePage';
import { ImageLibrary } from './figma-restore/image-library';
import { AudioLibrary } from './figma-restore/audio-library';
import { VideoLibrary } from './figma-restore/video-library';
import { IpCharacterManagement } from './modules/material-management/IpCharacterManagement';
import { AccountManagement } from './modules/admin/AccountManagement';
import IPSceneTestPage from './modules/test/IPSceneTestPage';
import { VideoGeneratorPage } from './modules/test/VideoGeneratorPage';
import { VoiceGeneratorPage } from './modules/test/VoiceGeneratorPage';
import { AdminDashboard } from './figma-restore/AdminDashboard';
import { CourseManagement } from './figma-restore/course-management';
import DesignSystemPreview from './modules/design-system/DesignSystemPreview';
import { PictureBookStudioPage } from './modules/picture-book/PictureBookStudioPage';
import { KnowledgeUploadPage } from './modules/picture-book/KnowledgeUploadPage';
import { SongWritingStudioPage } from './modules/song-writing/SongWritingStudioPage';
import { SongLibraryPage } from './modules/song-library/SongLibraryPage';
import { CreativeWorkshopPage } from './modules/creative-workshop/CreativeWorkshopPage';
import { ExperiencePage } from './modules/creative-workshop/ExperiencePage';
import { MyWorksPage } from './modules/creative-workshop/MyWorksPage';

const HomeRoute = () => {
  const { user } = useAuth();

  if (user?.role === ROLES.PICTURE_SONG_CREATOR) {
    return <Navigate to="/picture-books" replace />;
  }

  return (
    <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'viewer']}>
      <AdminDashboard />
    </RequireAuth>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            path="/design-system"
            element={<DesignSystemPreview />}
          />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* 首页 - Dashboard */}
            <Route
              path="/"
              element={<HomeRoute />}
            />

            <Route
              path="/figma-courses"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'viewer']}>
                  <CourseManagement />
                </RequireAuth>
              }
            />

            <Route
              path="/course-square"
              element={<CourseSquarePage />}
            />

            <Route
              path="/picture-books"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator']}>
                  <PictureBookStudioPage />
                </RequireAuth>
              }
            />

            <Route
              path="/song-writing"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator']}>
                  <SongWritingStudioPage />
                </RequireAuth>
              }
            />

            <Route
              path="/workshop/interactive-yoga"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer']}>
                  <ExperiencePage experience="yoga" />
                </RequireAuth>
              }
            />

            <Route
              path="/workshop/music-star-quest"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer']}>
                  <ExperiencePage experience="star" />
                </RequireAuth>
              }
            />

            <Route
              path="/workshop/:moduleId"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer']}>
                  <CreativeWorkshopPage />
                </RequireAuth>
              }
            />

            <Route
              path="/my-works"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer']}>
                  <MyWorksPage />
                </RequireAuth>
              }
            />

            <Route
              path="/song-library"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin']}>
                  <SongLibraryPage />
                </RequireAuth>
              }
            />

            <Route
              path="/picture-book-knowledge"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <KnowledgeUploadPage />
                </RequireAuth>
              }
            />

            <Route
              path="/voices"
              element={
                <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
                  <AudioLibrary />
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
                  <ImageLibrary />
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
                  <VideoLibrary />
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
