import React from 'react';
import { LayoutDashboard, BookOpen, Compass, Image, Music, Video, FileText, Users, Settings, ChevronRight } from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  {
    type: 'item',
    id: 'dashboard',
    label: '工作看板',
    icon: LayoutDashboard,
    active: true,
  },
  {
    type: 'group',
    title: '课程',
    items: [
      { id: 'course-manage', label: '课程管理', icon: BookOpen },
      { id: 'course-plaza', label: '课程广场', icon: Compass },
    ],
  },
  {
    type: 'group',
    title: '素材库',
    items: [
      { id: 'image-library', label: '图片库', icon: Image },
      { id: 'audio-library', label: '音频库', icon: Music },
      { id: 'video-library', label: '视频库', icon: Video },
      { id: 'material', label: '教材资源', icon: FileText },
    ],
  },
  {
    type: 'group',
    title: '系统管理',
    items: [
      { id: 'user-manage', label: '用户管理', icon: Users },
      { id: 'settings', label: '系统设置', icon: Settings },
    ],
  },
];

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
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className={`menu-item ${item.active ? 'active' : ''}`}
                >
                  <IconComponent className="menu-item-icon" size={14} />
                  <span className="menu-item-text">{item.label}</span>
                </div>
              );
            }
            return (
              <div key={item.title} className="menu-group">
                <div className="menu-group-title">{item.title}</div>
                {item.items.map((subItem) => {
                  const SubIconComponent = subItem.icon;
                  return (
                    <div key={subItem.id} className="submenu-item">
                      <SubIconComponent className="submenu-item-icon" size={14} />
                      <span className="submenu-item-text">{subItem.label}</span>
                    </div>
                  );
                })}
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