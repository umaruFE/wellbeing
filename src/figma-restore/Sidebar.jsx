import React from 'react';
import { NavLink } from 'react-router-dom';
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

const MenuLink = ({ item, className, iconClassName, textClassName }) => {
  const IconComponent = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => `${className} ${isActive ? 'active' : ''}`}
    >
      <IconComponent className={iconClassName} size={14} />
      <span className={textClassName}>{item.label}</span>
    </NavLink>
  );
};

export const Sidebar = () => {
  const { t } = useTranslation();

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
    <div className="sidebar">
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
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="sidebar-footer">
        <ChevronRight className="sidebar-footer-icon" size={14} />
      </div>
    </div>
  );
};
