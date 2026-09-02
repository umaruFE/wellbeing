import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen, ChevronDown, ChevronRight, Compass, Dumbbell, FolderOpen,
  Gamepad2, GraduationCap, Image, Library, Music, Palette, Settings,
  Sparkles, Star, Users,
} from 'lucide-react';
import './Sidebar.css';

const PICTURE_SONG_CREATOR = 'picture_song_creator';

const MenuLink = ({ item, depth = 0, collapsed }) => {
  const IconComponent = item.icon;
  const location = useLocation();

  if (item.disabled) {
    return (
      <div
        className="sidebar-node sidebar-node-disabled"
        style={{ '--menu-depth': depth }}
        title={collapsed ? item.label : `${item.label}（待建设）`}
        aria-disabled="true"
      >
        <IconComponent className="sidebar-node-icon" size={14} />
        <span className="sidebar-node-text">{item.label}</span>
        <span className="sidebar-coming-soon">待建设</span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? item.label : undefined}
      onClick={() => {
        if (location.pathname === item.path) {
          window.dispatchEvent(new CustomEvent('wellbeing:nav-same-route', { detail: { path: item.path } }));
        }
      }}
      className={({ isActive }) => `sidebar-node ${isActive ? 'active' : ''}`}
      style={{ '--menu-depth': depth }}
    >
      <IconComponent className="sidebar-node-icon" size={14} />
      <span className="sidebar-node-text">{item.label}</span>
    </NavLink>
  );
};

const hasActiveDescendant = (item, pathname) => (
  item.path === pathname || item.children?.some((child) => hasActiveDescendant(child, pathname))
);

const MenuBranch = ({ item, depth = 0, collapsed, openBranches, onToggle }) => {
  const location = useLocation();
  const isOpen = openBranches.has(item.id) || hasActiveDescendant(item, location.pathname);
  const IconComponent = item.icon;

  return (
    <div className="sidebar-branch">
      <button
        type="button"
        className={`sidebar-node sidebar-branch-trigger ${hasActiveDescendant(item, location.pathname) ? 'has-active-child' : ''}`}
        style={{ '--menu-depth': depth }}
        title={collapsed ? item.label : undefined}
        aria-expanded={isOpen}
        onClick={() => onToggle(item.id)}
      >
        <IconComponent className="sidebar-node-icon" size={14} />
        <span className="sidebar-node-text">{item.label}</span>
        <ChevronDown className={`sidebar-branch-chevron ${isOpen ? 'open' : ''}`} size={14} />
      </button>
      {isOpen && !collapsed && (
        <div className="sidebar-branch-children">
          {item.children.map((child) => (
            child.children ? (
              <MenuBranch
                key={child.id}
                item={child}
                depth={depth + 1}
                collapsed={collapsed}
                openBranches={openBranches}
                onToggle={onToggle}
              />
            ) : (
              <MenuLink key={child.id} item={child} depth={depth + 1} collapsed={collapsed} />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [openBranches, setOpenBranches] = React.useState(() => new Set(['creation-workshop', 'english-plus']));

  const creationWorkshop = {
    type: 'branch', id: 'creation-workshop', label: t('sidebar.creationWorkshop'), icon: Sparkles,
    children: [
      {
        id: 'english-plus', label: t('sidebar.englishPlus'), icon: GraduationCap,
        children: [
          { id: 'art-expression', label: t('sidebar.artExpression'), icon: Palette, path: '/picture-books' },
          {
            id: 'somatic-exploration', label: t('sidebar.somaticExploration'), icon: Dumbbell,
            children: [
              { id: 'interactive-yoga', label: t('sidebar.interactiveYoga'), icon: Dumbbell, path: '/workshop/interactive-yoga' },
            ],
          },
          {
            id: 'music-and-movement', label: t('sidebar.musicAndMovement'), icon: Music,
            children: [
              { id: 'music-star-quest', label: t('sidebar.musicStarQuest'), icon: Star, path: '/workshop/music-star-quest' },
              { id: 'song-workshop', label: t('sidebar.songWorkshop'), icon: Music, path: '/song-writing' },
            ],
          },
        ],
      },
      { id: 'skills-training', label: t('sidebar.skillsTraining'), icon: GraduationCap, path: '/workshop/skills-training' },
      { id: 'fun-practice', label: t('sidebar.funPractice'), icon: Gamepad2, path: '/workshop/fun-practice' },
      { id: 'complete-course', label: t('sidebar.completeCourse'), icon: BookOpen, path: '/workshop/complete-course' },
      { id: 'themed-activities', label: t('sidebar.themedActivities'), icon: Star, path: '/workshop/themed-activities' },
      { id: 'teaching-materials', label: t('sidebar.teachingMaterials'), icon: Image, path: '/workshop/teaching-materials' },
    ],
  };

  const fullMenu = [
    creationWorkshop,
    { type: 'item', id: 'my-works', label: t('sidebar.myWorks'), icon: FolderOpen, path: '/my-works' },
    { type: 'item', id: 'inspiration-square', label: t('sidebar.inspirationSquare'), icon: Compass, path: '/course-square' },
    { type: 'item', id: 'textbook-library', label: t('sidebar.textbookLibrary'), icon: Library, path: '/knowledge-base' },
    {
      type: 'branch', id: 'system-management', label: t('sidebar.systemGroup'), icon: Settings,
      children: [
        { id: 'user-manage', label: t('sidebar.userManage'), icon: Users, path: '/accounts' },
        { id: 'settings', label: t('sidebar.systemSettings'), icon: Settings, path: '/super-admin' },
      ],
    },
  ];

  const restrictedCreationWorkshop = {
    ...creationWorkshop,
    children: creationWorkshop.children.filter((item) => item.id === 'english-plus'),
  };
  const menuItems = user?.role === PICTURE_SONG_CREATOR ? [restrictedCreationWorkshop] : fullMenu;

  const toggleBranch = (id) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenBranches((current) => new Set(current).add(id));
      return;
    }
    setOpenBranches((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon"><Sparkles size={16} /></div>
          <span className="logo-text">{t('common.appName')}</span>
        </div>
        <nav className="sidebar-menu" aria-label={t('sidebar.navigation')}>
          {menuItems.map((item) => (
            item.type === 'branch' ? (
              <MenuBranch key={item.id} item={item} collapsed={collapsed} openBranches={openBranches} onToggle={toggleBranch} />
            ) : (
              <MenuLink key={item.id} item={item} collapsed={collapsed} />
            )
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          <ChevronRight className="sidebar-footer-icon" size={14} />
        </button>
      </div>
    </aside>
  );
};
