import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Dropdown, Drawer, Form, Modal, message } from 'antd';
import { Search, BellOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TaskCenter } from './TaskCenter';
import './Header.css';

export const Header = ({ title = '工作看板' }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pageTitle = {
    '/': '工作看板',
    '/figma-courses': '课程管理',
    '/ppt-images': '图片库',
    '/voices': '音频库',
    '/video-materials': '视频库',
    '/knowledge-base': '教材资源',
    '/accounts': '用户管理',
    '/super-admin': '系统设置',
  }[location.pathname] || title;

  const displayName = user?.name || user?.username || 'Admin';

  const openSettings = () => {
    settingsForm.resetFields();
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    const values = await settingsForm.validateFields();
    setSavingSettings(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '密码修改失败');
      }

      setSettingsOpen(false);
      settingsForm.resetFields();
      message.success('密码已修改');
    } catch (error) {
      message.error(error?.message || '密码修改失败');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login', { replace: true });
  };
  
  const menu = {
    items: [
      { key: 'settings', label: '个人设置' },
      { key: 'logout', label: '退出登录' },
    ],
    onClick: ({ key }) => {
      if (key === 'settings') openSettings();
      if (key === 'logout') handleLogout();
    },
  };
  
  const handleTaskButtonClick = () => {
    setDrawerVisible(true);
  };

  return (
    <div className="header">
      <span className="breadcrumb-link">{pageTitle}</span>
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
          <Dropdown menu={menu} trigger={['click']}>
            <div className="user-wrapper">
              <div className="user-avatar" />
              <div className="user-info">
                <span className="user-name">{displayName}</span>
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

      <Modal
        title="修改密码"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={handleSaveSettings}
        okText="保存"
        cancelText="取消"
        confirmLoading={savingSettings}
        width={460}
      >
        <Form form={settingsForm} layout="vertical" className="profile-settings-form">
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '新密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
