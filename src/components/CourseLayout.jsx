import React, { useState, useCallback } from 'react';
import { useParams, Outlet, useLocation } from 'react-router-dom';
import { CourseStepNavigation } from './CourseStepNavigation';
import { RequireAuth } from './RequireAuth';

const CourseLayoutContext = React.createContext(null);

export const useCourseLayout = () => {
  const ctx = React.useContext(CourseLayoutContext);
  return ctx || { setTitle: () => {}, setActions: () => {} };
};

const stepMap = {
  overview: 1,
  'lesson-plan': 2,
  ppt: 3,
  reading: 4,
};

export const CourseLayout = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const pathSegment = location.pathname.split(`/courses/${courseId}/`)[1] || 'overview';
  const currentStep = stepMap[pathSegment] || 1;

  const [navTitle, setNavTitle] = useState(null);
  const [navActions, setNavActions] = useState(null);

  const setTitle = useCallback((t) => setNavTitle(t), []);
  const setActions = useCallback((a) => setNavActions(a), []);

  return (
    <CourseLayoutContext.Provider value={{ setTitle, setActions }}>
      <RequireAuth requiredRoles={['super_admin', 'org_admin', 'research_leader', 'creator']}>
        <div
          className="flex flex-col h-screen overflow-hidden"
          style={{ backgroundColor: '#F7F5F1', fontFamily: '"HarmonyOS Sans SC", system-ui, sans-serif' }}
        >
          <div className="p-4 pb-0 shrink-0">
            <CourseStepNavigation
              courseId={courseId}
              currentStep={currentStep}
              title={navTitle}
              actions={navActions}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </RequireAuth>
    </CourseLayoutContext.Provider>
  );
};

export default CourseLayout;
