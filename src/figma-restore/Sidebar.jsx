import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronRight,
  Compass,
  FileText,
  Image,
  LayoutDashboard,
  Music,
  Settings,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import './Sidebar.css';

const MenuLink = ({ item, className, iconClassName, textClassName, collapsed }) => {
  const IconComponent = item.icon;
  const location = useLocation();

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
      className={({ isActive }) => `${className} ${isActive ? 'active' : ''}`}
    >
      <IconComponent className={iconClassName} size={14} />
      <span className={textClassName}>{item.label}</span>
    </NavLink>
  );
};

export const Sidebar = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    {
      type: 'item',
      id: 'dashboard',
      label: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      path: '/',
      end: true,
    },
    {
      type: 'group',
      title: t('sidebar.courseGroup'),
      items: [
        { id: 'course-manage', label: t('sidebar.courseManage'), icon: BookOpen, path: '/figma-courses' },
        { id: 'course-plaza', label: t('sidebar.courseSquare'), icon: Compass, path: '/course-square' },
      ],
    },
    {
      type: 'group',
      title: t('sidebar.assetGroup'),
      items: [
        { id: 'image-library', label: t('sidebar.imageLibrary'), icon: Image, path: '/ppt-images' },
        { id: 'audio-library', label: t('sidebar.audioLibrary'), icon: Music, path: '/voices' },
        { id: 'video-library', label: t('sidebar.videoLibrary'), icon: Video, path: '/video-materials' },
        { id: 'material', label: t('sidebar.materialResource'), icon: FileText, path: '/knowledge-base' },
      ],
    },
    {
      type: 'group',
      title: t('sidebar.systemGroup'),
      items: [
        { id: 'user-manage', label: t('sidebar.userManage'), icon: Users, path: '/accounts' },
        { id: 'settings', label: t('sidebar.systemSettings'), icon: Settings, path: '/super-admin' },
      ],
    },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Sparkles size={16} />
          </div>
          <span className="logo-text">{t('common.appName')}</span>
        </div>
        <div className="sidebar-menu">
          {menuItems.map((item) => {
            if (item.type === 'item') {
              return (
                <MenuLink
                  key={item.id}
                  item={item}
                  className="menu-item"
                  iconClassName="menu-item-icon"
                  textClassName="menu-item-text"
                  collapsed={collapsed}
                />
              );
            }

            return (
              <div key={item.title} className="menu-group">
                <div className="menu-group-title">{item.title}</div>
                {item.items.map((subItem) => (
                  <MenuLink
                    key={subItem.id}
                    item={subItem}
                    className="submenu-item"
                    iconClassName="submenu-item-icon"
                    textClassName="submenu-item-text"
                    collapsed={collapsed}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? '展开导航栏' : '收起导航栏'}
          title={collapsed ? '展开导航栏' : '收起导航栏'}
        >
          <ChevronRight className="sidebar-footer-icon" size={14} />
        </button>
      </div>
    </div>
  );
};
