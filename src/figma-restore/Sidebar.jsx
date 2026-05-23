import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Compass,
  FileText,
  Image,
  LayoutDashboard,
  Music,
  Settings,
  Users,
  Video,
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  {
    type: 'item',
    id: 'dashboard',
    label: '工作看板',
    icon: LayoutDashboard,
    path: '/',
    end: true,
  },
  {
    type: 'group',
    title: '课程',
    items: [
      { id: 'course-manage', label: '课程管理', icon: BookOpen, path: '/figma-courses' },
      { id: 'course-plaza', label: '课程广场', icon: Compass, path: '/course-square' },
    ],
  },
  {
    type: 'group',
    title: '素材库',
    items: [
      { id: 'image-library', label: '图片库', icon: Image, path: '/ppt-images' },
      { id: 'audio-library', label: '音频库', icon: Music, path: '/voices' },
      { id: 'video-library', label: '视频库', icon: Video, path: '/video-materials' },
      { id: 'material', label: '教材资源', icon: FileText, path: '/knowledge-base' },
    ],
  },
  {
    type: 'group',
    title: '系统管理',
    items: [
      { id: 'user-manage', label: '用户管理', icon: Users, path: '/accounts' },
      { id: 'settings', label: '系统设置', icon: Settings, path: '/super-admin' },
    ],
  },
];

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
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <ChevronRight size={16} />
          </div>
          <span className="logo-text">CourseGen AI</span>
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
