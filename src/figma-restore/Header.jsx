import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Dropdown, Drawer, Form, Modal, message } from 'antd';
import { Search, BellOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TaskCenter } from './TaskCenter';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { parseJsonSafely } from '../utils/responseUtils';
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
      const result = await parseJsonSafely(response);
      if (response.ok && result?.success) {
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
        throw new Error(result.error || t('uiMessages.passwordChangeFailed'));
      }

      setSettingsOpen(false);
      settingsForm.resetFields();
      message.success(t('uiMessages.passwordChanged'));
    } catch (error) {
      message.error(error?.message || t('uiMessages.passwordChangeFailed'));
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
            label={i18next.t('headerUi.33abf70fd5')}
            name="currentPassword"
            rules={[{ required: true, message: t('headerUi.4b0b00e054') }]}
          >
            <Input.Password placeholder={i18next.t('headerUi.4b0b00e054')} autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label={i18next.t('headerUi.d22c9c0085')}
            name="newPassword"
            rules={[
              { required: true, message: t('headerUi.23ba228494') },
              { min: 6, message: t('headerUi.passwordMinLength') },
            ]}
          >
            <Input.Password placeholder={i18next.t('headerUi.23ba228494')} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label={i18next.t('headerUi.d4477adb6f')}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('headerUi.eb82e7f0a9') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('headerUi.passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={i18next.t('headerUi.eb82e7f0a9')} autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
