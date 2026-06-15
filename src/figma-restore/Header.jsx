import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Dropdown, Drawer, Form, Modal, message } from 'antd';
import { Search, BellOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TaskCenter } from './TaskCenter';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import './Header.css';

export const Header = ({ title }) => {
  const { t } = useTranslation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [settingsForm] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pageTitle = {
    '/': t('header.dashboard'),
    '/figma-courses': t('header.courseManage'),
    '/ppt-images': t('header.imageLibrary'),
    '/voices': t('header.audioLibrary'),
    '/video-materials': t('header.videoLibrary'),
    '/knowledge-base': t('header.materialResource'),
    '/accounts': t('header.userManage'),
    '/super-admin': t('header.systemSettings'),
  }[location.pathname] || title || t('header.dashboard');

  const displayName = user?.name || user?.username || 'Admin';

  const loadTaskCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/background-tasks?scope=active', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setTaskCount(result.data?.tasks?.length || 0);
      }
    } catch {
      setTaskCount(0);
    }
  };

  useEffect(() => {
    loadTaskCount();
    const timer = window.setInterval(loadTaskCount, 10000);
    return () => window.clearInterval(timer);
  }, []);

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
    message.success(t('header.logout'));
    navigate('/login', { replace: true });
  };
  
  const menu = {
    items: [
      { key: 'settings', label: t('header.profile') },
      { key: 'logout', label: t('header.logout') },
    ],
    onClick: ({ key }) => {
      if (key === 'settings') openSettings();
      if (key === 'logout') handleLogout();
    },
  };
  
  const handleTaskButtonClick = () => {
    loadTaskCount();
    setDrawerVisible(true);
  };

  return (
    <div className="header">
      <span className="breadcrumb-link">{pageTitle}</span>
      <div className="header-right">
        <Input
          placeholder={t('common.search')}
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
            <span className="task-text">{t('header.taskCenter')} {taskCount}</span>
          </button>
          <div className="bell-wrapper">
            <BellOff className="bell-icon" size={18} />
          </div>
          <LanguageSwitcher />
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
        onClose={() => {
          setDrawerVisible(false);
          loadTaskCount();
        }}
        open={drawerVisible}
        width={420}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        <TaskCenter
          onClose={() => {
            setDrawerVisible(false);
            loadTaskCount();
          }}
        />
      </Drawer>

      <Modal
        title={t('header.profile')}
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={handleSaveSettings}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
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
