import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VideoStoryboardModal from '../../components/VideoStoryboardModal';

export const VideoGeneratorPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const userId = user?.id || null;
  const organizationId = user?.organizationId || null;

  const handleConfirm = (data) => {
    console.log('视频生成完成:', data);
    alert(`视频「${data.title}」生成成功！\n分镜数：${data.scenes?.length || 0}\n时长：${data.duration}秒`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">AI视频生成器</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {user ? user.name || user.email || '用户' : '未登录'}
            </span>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                AI视频分镜生成器
              </h1>
              <p className="text-gray-600 mb-8">
                通过AI智能分析，一键生成分镜脚本和图片，并合成精美视频
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-3 mx-auto text-lg font-medium shadow-lg hover:shadow-xl"
              >
                <Video className="w-6 h-6" />
                打开视频生成器
              </button>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">功能特点：</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-medium text-gray-800 mb-1">智能分镜</h3>
                  <p className="text-sm text-gray-500">AI自动分析故事内容，生成专业的分镜脚本</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-medium text-gray-800 mb-1">精美图片</h3>
                  <p className="text-sm text-gray-500">支持多种风格，生成分镜图片保持视觉一致性</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎬</div>
                  <h3 className="font-medium text-gray-800 mb-1">视频合成</h3>
                  <p className="text-sm text-gray-500">基于LTX-Video模型，生成流畅连贯的视频</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">使用步骤：</h2>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>填写故事核心要素和整体风格描述</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>AI自动生成分镜脚本和图片</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>预览并调整分镜图片</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span>点击生成视频，等待AI合成最终作品</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* 视频生成模态框 */}
      <VideoStoryboardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        userId={userId}
        organizationId={organizationId}
      />
    </div>
  );
};

export default VideoGeneratorPage;
