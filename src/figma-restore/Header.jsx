import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Dropdown, Drawer, Form, Modal, message } from 'antd';
import { ChevronDown, ListTodo } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TaskCenter } from './TaskCenter';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { parseJsonSafely } from '../utils/responseUtils';
import './Header.css';

export const Header = ({ title }) => {
  const { t } = useTranslation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [taskCount, setTaskCount] = useState(null);
  const [settingsForm] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const pageTitle = {
    '/': t('header.dashboard'),
    '/figma-courses': t('sidebar.completeCourse'),
    '/picture-books': t('sidebar.artExpression'),
    '/my-works': t('sidebar.myWorks'),
    '/course-square': t('sidebar.inspirationSquare'),
    '/workshop/english-plus': t('workshopPage.modules.english-plus.title'),
    '/workshop/skills-training': t('sidebar.skillsTraining'),
    '/workshop/fun-practice': t('sidebar.funPractice'),
    '/workshop/complete-course': t('sidebar.completeCourse'),
    '/workshop/themed-activities': t('sidebar.themedActivities'),
    '/workshop/teaching-materials': t('sidebar.teachingMaterials'),
    '/song-writing': t('sidebar.songWorkshop'),
    '/workshop/music-star-quest': t('sidebar.musicStarQuest'),
    '/workshop/interactive-yoga/motions': '角色动作库',
    '/workshop/interactive-yoga': t('sidebar.interactiveYoga'),
    '/workshop/spin-speak': t('sidebar.spinSpeak'),
    '/workshop/doodle': t('sidebar.doodleGame'),
    '/workshop/move-match': t('sidebar.moveMatch'),
    '/song-library': t('songLibraryUi.9e98d91694'),
    '/picture-book-knowledge': t('knowledgeUploadUi.edf216cb00'),
    '/ppt-images': t('header.imageLibrary'),
    '/voices': t('header.audioLibrary'),
    '/video-materials': t('header.videoLibrary'),
    '/audio-generator': t('testAudioUi.212cb198ea'),
    '/knowledge-base': t('sidebar.textbookLibrary'),
    '/ip-characters': t('ipCharacter.title'),
    '/accounts': t('header.userManage'),
    '/super-admin': t('header.systemSettings'),
    '/test/ip-scene': t('testIpUi.ba8644ec76'),
    '/test/video-generator': t('testVideoUi.96e92dfb39'),
    '/test/voice-generator': t('testVoiceUi.8e8251a806'),
    '/test/audio-generator': t('testAudioUi.212cb198ea'),
  }[pathname] || title || t('header.dashboard');

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
      setTaskCount(response.ok && result?.success && Array.isArray(result.data?.tasks)
        ? result.data.tasks.length
        : null);
    } catch {
      setTaskCount(null);
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
    <header className="header">
      <span className="breadcrumb-link">{pageTitle}</span>
      <div className="header-right">
        <div className="header-actions">
          <button type="button" data-wb-button="secondary" aria-haspopup="dialog" aria-expanded={drawerVisible} onClick={handleTaskButtonClick}>
            <ListTodo size={16} aria-hidden="true" />
            <span className="task-text">{t('header.taskCenter')}{taskCount === null ? '' : ` ${taskCount}`}</span>
          </button>
          <LanguageSwitcher />
          <Dropdown menu={menu} trigger={['click']} open={profileOpen} onOpenChange={setProfileOpen}>
            <button type="button" data-wb-button="quiet" className="user-wrapper" aria-label={t('header.profile')} aria-haspopup="menu" aria-expanded={profileOpen}>
              <span className="user-avatar" aria-hidden="true" />
              <span className="user-name">{displayName}</span>
              <ChevronDown className="user-arrow" size={12} aria-hidden="true" />
            </button>
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
        width="min(420px, 100vw)"
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
        aria-label={t('header.taskCenter')}
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
    </header>
  );
};
