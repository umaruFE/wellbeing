import React, { useState } from 'react';
import { Input, Dropdown, Menu, Drawer } from 'antd';
import { Search, BellOff, ChevronDown } from 'lucide-react';
import { TaskCenter } from './TaskCenter';
import './Header.css';

export const Header = ({ title = '工作看板' }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const menu = (
    <Menu>
      <Menu.Item key="1">个人设置</Menu.Item>
      <Menu.Item key="2">退出登录</Menu.Item>
    </Menu>
  );
  
  const handleTaskButtonClick = () => {
    setDrawerVisible(true);
  };

  return (
    <div className="header">
      <span className="breadcrumb-link">{title}</span>
      <div className="header-right">
        <Input
          placeholder="搜索"
          prefix={<Search size={14} />}
          style={{
            border: '2px solid #333e4e',
            borderRadius: '100px',
            backgroundColor: '#ffffff',
            padding: '3px 10px',
            width: '262px',
            height: '32px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#a4abb8',
          }}
        />
        <div className="header-actions">
          <button className="task-button" onClick={handleTaskButtonClick}>
            <div className="task-dot" />
            <span className="task-text">后台任务 2</span>
          </button>
          <div className="bell-wrapper">
            <BellOff className="bell-icon" size={18} />
          </div>
          <Dropdown overlay={menu}>
            <div className="user-wrapper">
              <div className="user-avatar" />
              <div className="user-info">
                <span className="user-name">Admin</span>
                <ChevronDown className="user-arrow" size={12} />
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
      
      <Drawer
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={420}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        <TaskCenter onClose={() => setDrawerVisible(false)} />
      </Drawer>
    </div>
  );
};