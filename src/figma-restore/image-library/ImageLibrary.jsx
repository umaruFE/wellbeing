import React from 'react';
import { BookOpen, Eye, FileText, Image, Monitor, MoreVertical, Plus, Search, Trash2, Upload as UploadIcon, X } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import apiService from '../../services/api';
import './ImageLibrary.css';
import { AssetPreviewModal } from './AssetPreviewModal';
import { TaskDetailModal } from '../TaskDetailModal';

export const IMAGE_ASSETS = [];

const sourceOptions = [
  { label: '全部来源', value: '' },
  { label: 'AI生成', value: 'AI生成' },
  { label: '手动上传', value: '手动上传' },
];

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '主题意境图', value: '主题意境图' },
  { label: 'PPT素材', value: 'PPT素材' },
  { label: '闪卡', value: '闪卡' },
  { label: '故事配图', value: '故事配图' },
];

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/');
}

function normalizeSource(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('ai') || raw.includes('generate')) return 'AI生成';
  if (raw.includes('upload') || raw.includes('manual')) return '手动上传';
  if (raw.includes('course')) return '课程同步';
  return value || '素材库';
}

export function normalizeImageAsset(item = {}) {
  const categoryName = item.category?.name || item.category_name || item.type || item.image_type;
  const width = item.width || item.image_width;
  const height = item.height || item.image_height;
  return {
    id: item.id || item.image_url || `image-${Math.random().toString(36).slice(2, 10)}`,
    name: item.name || item.title || item.filename || '未命名图片素材',
    source: normalizeSource(item.source || item.source_type || item.origin),
    type: categoryName || 'PPT素材',
    size: width && height ? `${width} × ${height}` : item.size || item.resolution || '--',
    created: formatDateTime(item.created_at || item.createdAt || item.created),
    scene: item.scene || 'manual',
    previewUrl: item.image_url || item.imageUrl || item.url || item.preview_url || item.thumbnail_url,
    raw: item,
  };
}

function mergeOptions(baseOptions, assets, field) {
  const existing = new Set(baseOptions.map((item) => item.value));
  const extra = assets
    .map((asset) => asset[field])
    .filter(Boolean)
    .filter((value) => !existing.has(value));
  return [
    ...baseOptions,
    ...Array.from(new Set(extra)).map((value) => ({ label: value, value })),
  ];
}

export const createImageTaskDetail = (asset) => ({
  type: 'image',
  title: asset.name,
  count: 'x 1 张',
  course: '图片库素材',
  status: 'done',
  statusText: '已完成',
  submit: asset.created,
  engine: `${asset.type} · ${asset.source}`,
  progress: 100,
  prompt: asset.source === 'AI生成'
    ? `生成${asset.name}，风格适合课堂演示与课件画布。`
    : `手动上传图片素材：${asset.name}`,
  spec: `${asset.size} · PNG`,
  scenes: [asset.scene, asset.scene, asset.scene, asset.scene],
  result: {
    url: asset.previewUrl || asset.imageUrl || asset.image_url || asset.url,
  },
  config: [
    ['素材类型', asset.type],
    ['来源', asset.source],
    ['图片尺寸', asset.size],
    ['格式', 'PNG'],
  ],
});

const insertConfigs = {
  cover: {
    name: '课程地图封面',
    foot: '已选择：课程地图封面',
    helper: '图片将替换课程地图封面，便于作为课程详情页的第一视觉。',
    icon: Image,
    desc: '替换或加入课程地图封面候选',
  },
  ppt: {
    name: 'PPT 课件',
    foot: '已选择：PPT 课件',
    helper: '图片会插入为当前 PPT 画布中的图片图层，可继续拖拽、缩放和调整层级。',
    icon: Monitor,
    desc: '继续选择环节和具体 PPT 页',
  },
  reading: {
    name: '阅读材料',
    foot: '已选择：阅读材料',
    helper: '图片会插入到阅读材料页面中，可作为插图、背景或视觉提示使用。',
    icon: BookOpen,
    desc: '选择阅读材料页面插入图片',
  },
};

function SceneArt({ scene, src, alt }) {
  if (src) {
    return <img className="fr-img-real-image" src={src} alt={alt || ''} />;
  }

  return (
    <div className={`fr-img-scene scene-${scene}`}>
      <span className="shape orb a" />
      <span className="shape orb b" />
      <span className="shape orb c" />
      <span className="shape block d" />
    </div>
  );
}

function InsertModal({ asset, open, onClose, onConfirm }) {
  const [target, setTarget] = React.useState('cover');

  React.useEffect(() => {
    if (open) setTarget('cover');
  }, [open]);

  if (!asset) return null;
  const cfg = insertConfigs[target];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={960}
      className="fr-img-modal fr-img-insert-modal"
      closeIcon={<X size={20} />}
      title={(
        <div>
          <div className="fr-img-modal-title">选择插入位置</div>
          <div className="fr-img-modal-sub">先选择目标课程，再选择课程模块与模块内的具体位置。</div>
        </div>
      )}
    >
      <div className="fr-img-insert-body">
        <aside className="fr-img-insert-preview">
          <div className="fr-img-insert-art"><SceneArt scene={asset.scene} src={asset.previewUrl} alt={asset.name} /></div>
          <div className="fr-img-insert-meta">
            <div className="fr-img-insert-name">{asset.name}</div>
            <div className="fr-img-insert-line">
              <Tag color="error">{asset.type}</Tag>
              <Tag>{asset.source}</Tag>
            </div>
          </div>
        </aside>
        <section className="fr-img-insert-panel">
          <div className="fr-img-insert-section">目标课程</div>
          <label className="fr-img-field full">
            <span>选择课程</span>
            <Select
              style={{ width: '100%' }}
              defaultValue="Unit 3: Animals（神奇的动物）"
              options={[
                { value: 'Unit 3: Animals（神奇的动物）', label: 'Unit 3: Animals（神奇的动物）' },
                { value: 'Unit 2: Greetings', label: 'Unit 2: Greetings' },
                { value: '森林星光音乐会', label: '森林星光音乐会' },
              ]}
            />
          </label>

          <div className="fr-img-insert-section">课程模块</div>
          <div className="fr-img-choice-grid">
            {Object.entries(insertConfigs).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button key={key} type="button" className={`fr-img-choice ${target === key ? 'active' : ''}`} onClick={() => setTarget(key)}>
                  <span className="fr-img-choice-ico"><Icon size={18} /></span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.desc}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="fr-img-insert-section">模块内位置</div>
          <div className="fr-img-form-grid">
            {target === 'cover' && (
              <label className="fr-img-field full">
                <span>封面位置</span>
                <Select
                  style={{ width: '100%' }}
                  defaultValue="替换当前课程地图封面"
                  options={[
                    { value: '替换当前课程地图封面', label: '替换当前课程地图封面' },
                    { value: '添加为封面备选图', label: '添加为封面备选图' },
                  ]}
                />
              </label>
            )}
            {target === 'ppt' && (
              <>
                <label className="fr-img-field">
                  <span>目标环节</span>
                  <Select
                    style={{ width: '100%' }}
                    defaultValue="星际信号接收站"
                    options={[
                      { value: '星际信号接收站', label: '星际信号接收站' },
                      { value: '动物能量球在哪里？', label: '动物能量球在哪里？' },
                      { value: '救援地图解码器', label: '救援地图解码器' },
                      { value: '建造动物家园发射台', label: '建造动物家园发射台' },
                    ]}
                  />
                </label>
                <label className="fr-img-field">
                  <span>目标 PPT 页</span>
                  <Select
                    style={{ width: '100%' }}
                    defaultValue="幻灯片 1 · 情境导入"
                    options={[
                      { value: '幻灯片 1 · 情境导入', label: '幻灯片 1 · 情境导入' },
                      { value: '幻灯片 2 · 任务背景', label: '幻灯片 2 · 任务背景' },
                      { value: '幻灯片 3 · 语言练习', label: '幻灯片 3 · 语言练习' },
                      { value: '新建一页空白幻灯片', label: '新建一页空白幻灯片' },
                    ]}
                  />
                </label>
              </>
            )}
            {target === 'reading' && (
              <label className="fr-img-field full">
                <span>阅读材料页面</span>
                <Select
                  style={{ width: '100%' }}
                  defaultValue="动物救援任务单 · 第 1 页"
                  options={[
                    { value: '动物救援任务单 · 第 1 页', label: '动物救援任务单 · 第 1 页' },
                    { value: '情绪词汇观察页 · 第 2 页', label: '情绪词汇观察页 · 第 2 页' },
                    { value: '小组合作记录单 · 第 3 页', label: '小组合作记录单 · 第 3 页' },
                    { value: '新建一页阅读材料', label: '新建一页阅读材料' },
                  ]}
                />
              </label>
            )}
            <div className="fr-img-insert-helper">{cfg.helper}</div>
          </div>
        </section>
      </div>
      <div className="fr-img-modal-footer split">
        <div className="fr-img-foot-note">{cfg.foot}</div>
        <Button onClick={onClose}>取消</Button>
        <Button className="fr-img-action-primary" type="primary" onClick={() => onConfirm(asset, target)}>确认插入</Button>
      </div>
    </Modal>
  );
}

export function ImageLibrary({ variant, onInsertTaskAsset } = {}) {
  const [assets, setAssets] = React.useState(IMAGE_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [insertAsset, setInsertAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);
  const [taskDetail, setTaskDetail] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    apiService.getPptImages({ limit: 200 })
      .then((result) => {
        if (!alive) return;
        setAssets((result.data || []).map(normalizeImageAsset));
      })
      .catch((error) => {
        console.error('获取图片库失败:', error);
        if (alive) {
          setAssets([]);
          message.error('获取图片库失败');
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const sourceFilterOptions = React.useMemo(() => mergeOptions(sourceOptions, assets, 'source'), [assets]);
  const typeFilterOptions = React.useMemo(() => mergeOptions(typeOptions, assets, 'type'), [assets]);

  const filteredAssets = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return assets.filter(asset => {
      const haystack = `${asset.name} ${asset.type} ${asset.source}`.toLowerCase();
      return (!keyword || haystack.includes(keyword))
        && (!source || asset.source === source)
        && (!type || asset.type === type);
    });
  }, [assets, search, source, type]);

  const readImageSize = (previewUrl) => new Promise(resolve => {
    const image = new window.Image();
    image.onload = () => resolve(`${image.naturalWidth} × ${image.naturalHeight}`);
    image.onerror = () => resolve('本地图片');
    image.src = previewUrl;
  });

  const handleUpload = async (file) => {
    if (!file?.type?.startsWith('image/')) {
      message.warning('请选择图片文件');
      return Upload.LIST_IGNORE;
    }

    const previewUrl = URL.createObjectURL(file);
    const imageSize = await readImageSize(previewUrl);
    const nextAsset = {
      id: `manual-${Date.now()}`,
      name: file.name?.replace(/\.[^/.]+$/, '') || '新上传课堂插图',
      source: '手动上传',
      type: 'PPT素材',
      size: imageSize,
      created: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
      scene: 'manual',
      previewUrl,
    };
    setAssets(current => [nextAsset, ...current]);
    message.success('图片已上传到图片库');
    return false;
  };

  const handleConfirmInsert = (asset, target) => {
    const cfg = insertConfigs[target] || insertConfigs.cover;
    setInsertAsset(null);
    message.success(`已将「${asset.name}」插入到「${cfg.name}」`);
  };

  const handleDeleteAsset = (asset) => {
    setAssets(current => current.filter(item => item.id !== asset.id));
    setPreviewAsset(current => (current?.id === asset.id ? null : current));
    setInsertAsset(current => (current?.id === asset.id ? null : current));
    setDeleteAsset(null);
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    message.success(`已删除「${asset.name}」`);
  };

  const handleAssetMenuClick = ({ key, domEvent }, asset) => {
    domEvent?.stopPropagation();
    if (key === 'detail') {
      setPreviewAsset(asset);
      return;
    }
    if (key === 'delete') {
      setDeleteAsset(asset);
    }
  };

  return (
    <section className={`fr-img-lib ${variant === 'ppt-picker' ? 'ppt-library-picker' : ''}`}>
      <div className="fr-img-page">
        <header className="fr-img-hero">
          <div className="fr-img-hero-left">
            <div className="fr-img-hero-icon"><Image size={30} /></div>
            <div>
              <h1>图片库</h1>
              <p>管理 AI 生成、课程同步和手动上传的图片素材</p>
            </div>
          </div>
          <Upload
            accept="image/*"
            beforeUpload={handleUpload}
            showUploadList={false}
          >
            <button className="fr-img-upload-btn" type="button">
              <UploadIcon size={16} />
              上传图片
            </button>
          </Upload>
        </header>

        <section className="fr-img-panel">
          <div className="fr-img-toolbar">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索图片"
              prefix={<Search size={16} />}
              allowClear
            />
            <div className="fr-img-filter-group">
              <Select value={source} onChange={setSource} options={sourceFilterOptions} />
              <Select value={type} onChange={setType} options={typeFilterOptions} />
            </div>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="fr-img-grid">
              {filteredAssets.map(asset => (
                <article className="fr-img-card" key={asset.id} onClick={() => setPreviewAsset(asset)}>
                  <div className="fr-img-thumb">
                    <SceneArt scene={asset.scene} src={asset.previewUrl} alt={asset.name} />
                    <Tag className="fr-img-source-tag">{asset.source}</Tag>
                  </div>
                  <div className="fr-img-meta">
                    <div className="fr-img-name">{asset.name}</div>
                    <div className="fr-img-chip-row">
                      <span className="fr-img-type-chip">{asset.type}</span>
                      <span className="fr-img-size">{asset.size}</span>
                    </div>
                    <div className="fr-img-footer">
                      <span>{asset.created}</span>
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          items: [
                            { key: 'detail', icon: <Eye size={14} />, label: '查看详情' },
                            { key: 'delete', icon: <Trash2 size={14} />, label: '删除', danger: true },
                          ],
                          onClick: (info) => handleAssetMenuClick(info, asset),
                        }}
                      >
                        <button
                          className="fr-img-card-menu-btn"
                          type="button"
                          aria-label="更多操作"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </Dropdown>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="fr-img-empty">
              <FileText size={30} />
              <strong>没有找到匹配的图片素材</strong>
              <span>调整关键词、来源或类型后再试试。</span>
            </div>
          )}
        </section>
      </div>

      <AssetPreviewModal
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        onViewTask={(asset) => {
          setTaskDetail(createImageTaskDetail(asset));
          setPreviewAsset(null);
        }}
      />

      <TaskDetailModal
        task={taskDetail}
        open={Boolean(taskDetail)}
        onClose={() => setTaskDetail(null)}
        onInsertTaskAsset={onInsertTaskAsset}
      />

      <InsertModal
        asset={insertAsset}
        open={Boolean(insertAsset)}
        onClose={() => setInsertAsset(null)}
        onConfirm={handleConfirmInsert}
      />
      <Modal
        open={Boolean(deleteAsset)}
        title="删除图片素材"
        className="fr-img-confirm-modal"
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => deleteAsset && handleDeleteAsset(deleteAsset)}
        onCancel={() => setDeleteAsset(null)}
        centered
      >
        <p>确认删除「{deleteAsset?.name}」吗？删除后将从当前图片库列表移除。</p>
      </Modal>
    </section>
  );
}
