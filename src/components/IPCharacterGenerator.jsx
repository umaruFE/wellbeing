import React, { useState, useCallback } from 'react';
import { Wand2, Loader2, Check, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import poppyImg from '../assets/ip/poppy.png';
import ediImg from '../assets/ip/edi.png';
import rollyImg from '../assets/ip/rolly.png';
import miloImg from '../assets/ip/milo.png';
import aceImg from '../assets/ip/ace.png';

const IP_CHARACTERS = [
  { id: 'poppy', name: 'Poppy', color: '粉色', colorHex: '#FFB6C1', thumbnail: poppyImg },
  { id: 'edi', name: 'Edi', color: '蓝色', colorHex: '#87CEEB', thumbnail: ediImg },
  { id: 'rolly', name: 'Rolly', color: '橘色', colorHex: '#FFA500', thumbnail: rollyImg },
  { id: 'milo', name: 'Milo', color: '黄色', colorHex: '#FFD700', thumbnail: miloImg },
  { id: 'ace', name: 'Ace', color: '紫色', colorHex: '#9370DB', thumbnail: aceImg },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const uploadService = {
  uploadFile: async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    const result = await response.json();
    return result;
  }
};

const pollTaskAndUpload = async (taskId, apiUrl, maxAttempts = 240, interval = 3000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/ai/task-status/${taskId}?useComfyUI=true&apiUrl=${encodeURIComponent(apiUrl || '')}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.status === 'completed') {
        if (data.url) {
          return { url: data.url, filename: data.filename || '' };
        }

        const outputs = data.outputs || data.result?.outputs || {};
        const saveImageNode = Object.values(outputs).find(node => node.images && node.images.length > 0);
        if (!saveImageNode) throw new Error('未找到生成的图片');

        const imageInfo = saveImageNode.images[0];
        const comfyuiUrl = apiUrl ? apiUrl.replace('/history/', '') : '';
        const imageUrl = `${comfyuiUrl}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder || ''}&type=${imageInfo.type || 'output'}`;

        const proxyUrl = `/api/ai/proxy-image?mode=stream&url=${encodeURIComponent(imageUrl)}`;
        const imgRes = await fetch(proxyUrl);
        const blob = await imgRes.blob();
        const file = new File([blob], imageInfo.filename, { type: 'image/png' });

        try {
          const uploadResult = await uploadService.uploadFile(file, 'ai-generated-images');
          if (uploadResult?.url) return { url: uploadResult.url, filename: imageInfo.filename };
        } catch {}

        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        return { url: base64, filename: imageInfo.filename };
      }

      if (data.status === 'failed') throw new Error(data.error || '生成失败');
    } catch (err) {
      if (err.message !== '生成失败' && !err.message.includes('未找到')) {
        // continue polling
      } else {
        throw err;
      }
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('生成超时');
};

const IPCharacterGenerator = ({ isOpen, onClose, onConfirm, userId, organizationId }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(async () => {
    if (!selectedCharacter || !prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const characterColors = { poppy: '粉色', edi: '蓝色', rolly: '橘色', milo: '黄色', ace: '紫色' };
      const rolePrompt = `${characterColors[selectedCharacter.id] || ''}的${selectedCharacter.name}角色，${prompt}`;

      const sceneResponse = await fetch('/api/ai/generate-scene', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          backgroundPrompt: '',
          roles: [{ name: selectedCharacter.id, prompt: rolePrompt, width, height }],
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!sceneResponse.ok) throw new Error(`生成失败: ${await sceneResponse.text()}`);
      const sceneData = await sceneResponse.json();
      if (!sceneData.success) throw new Error(sceneData.error || '生成失败');

      const characterTask = sceneData.tasks.find(t => t.type === 'character');
      if (!characterTask) throw new Error('未获取到生成任务');

      const result = await pollTaskAndUpload(characterTask.promptId, characterTask.apiUrl);
      setGeneratedImageUrl(result.url);
    } catch (err) {
      console.error('IP人物生成失败:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCharacter, prompt, userId, organizationId]);

  const handleConfirm = () => {
    if (!generatedImageUrl || !onConfirm) return;
    onConfirm({
      type: 'image',
      url: generatedImageUrl,
      title: `${selectedCharacter?.name || 'IP'}人物`
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[760px] mx-4 overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">IP 人物生成</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">选择 IP 角色</label>
            <div className="flex gap-2 flex-wrap">
              {IP_CHARACTERS.map(char => (
                <button
                  key={char.id}
                  onClick={() => { setSelectedCharacter(char); setGeneratedImageUrl(null); setError(null); }}
                  className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all ${
                    selectedCharacter?.id === char.id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={char.thumbnail} alt={char.name} className="w-12 h-18 rounded-lg object-cover" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-800">{char.name}</div>
                    <div className="text-[10px] text-gray-500">{char.color}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">描述动作 / 场景</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="例如：做瑜伽拉伸动作、跑步、举哑铃..."
              className="w-full h-20 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-purple-400 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">图片尺寸</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">宽</span>
                <input
                  type="number"
                  value={width}
                  onChange={e => setWidth(Number(e.target.value))}
                  min={256}
                  max={4096}
                  step={64}
                  className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-purple-400 transition-all"
                />
              </div>
              <span className="text-gray-400 text-sm">×</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">高</span>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  min={256}
                  max={4096}
                  step={64}
                  className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-purple-400 transition-all"
                />
              </div>
              <span className="text-[11px] text-gray-400">px</span>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          {generatedImageUrl && (
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <img src={generatedImageUrl} alt="生成结果" className="w-full h-64 object-contain bg-gray-50" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50">
          {generatedImageUrl ? (
            <>
              <button
                onClick={() => { setGeneratedImageUrl(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> 重新生成
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <Check size={14} /> 确认
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedCharacter || !prompt.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isGenerating ? (
                <><Loader2 size={14} className="animate-spin" /> 生成中...</>
              ) : (
                <><Wand2 size={14} /> 生成图片</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPCharacterGenerator;
