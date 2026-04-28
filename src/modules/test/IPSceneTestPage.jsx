import React, { useState, useEffect } from 'react';
import IPSceneGenerator from '../../components/IPSceneGenerator';
import { Wand2, Loader2 } from 'lucide-react';

const IPSceneTestPage = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  const userId = localStorage.getItem('userId') || 'test-user-id';
  const organizationId = localStorage.getItem('organizationId') || 'test-org-id';

  // 测试页面自动登录（使用测试账号）
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggingIn(true);
      setLoginError(null);
      
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userId', data.user?.id || 'test-user-id');
          localStorage.setItem('organizationId', data.user?.organizationId || 'test-org-id');
          console.log('测试用户登录成功');
        } else {
          setLoginError(data.error || '登录失败');
        }
      })
      .catch(error => {
        setLoginError('登录请求失败: ' + error.message);
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-alt p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-4">
              IP角色场景生成器测试页面
            </h1>
            <p className="text-primary-secondary mb-8">
              点击下方按钮打开IP角色场景生成器，测试完整功能流程
            </p>
            
            {/* 登录状态提示 */}
            {isLoggingIn && (
              <div className="mb-4 flex items-center justify-center gap-2 text-primary-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在登录测试账号...</span>
              </div>
            )}
            
            {loginError && (
              <div className="mb-4 p-3 bg-error-light border border-error-border text-error text-sm rounded-xl">
                {loginError}
              </div>
            )}
            
            <button
              onClick={() => setShowGenerator(true)}
              disabled={isLoggingIn}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-3 mx-auto text-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  准备中...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  打开IP场景生成器
                </>
              )}
            </button>
          </div>

          <div className="border-t border-stroke pt-8">
            <h2 className="text-xl font-semibold text-dark mb-4">测试步骤：</h2>
            <ol className="space-y-3 text-primary-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>选择要出现在场景中的IP角色（至少选择1个）</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>选择图片比例（默认16:9）</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>输入场景描述提示词，例如："美丽的绿色魔法森林，阳光透过树叶"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>点击"生成资源"按钮，等待背景和角色图片生成完成</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">5</span>
                <span>在画布上拖动角色到合适的位置</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">6</span>
                <span>使用缩放和旋转按钮调整角色大小和角度</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">7</span>
                <span>点击"合成图片"按钮，生成最终场景图片</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">8</span>
                <span>点击"下载"按钮保存生成的图片</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <IPSceneGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        userId={userId}
        organizationId={organizationId}
      />
    </div>
  );
};

export default IPSceneTestPage;
