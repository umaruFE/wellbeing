import React from 'react';
import { BookOpen, Eye, FileText, Image, Monitor, MoreVertical, Plus, Search, Trash2, Upload as UploadIcon, X } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import './ImageLibrary.css';

const IMAGE_ASSETS = [
  { id: 'img-air', name: '星际信号接收站主题图', source: 'AI生成', type: '主题意境图', size: '1024 × 1024', created: '2026/04/13 10:06:30', scene: 'air' },
  { id: 'img-kitchen', name: '动物厨房任务背景', source: 'AI生成', type: 'PPT素材', size: '1920 × 1080', created: '2026/04/13 10:08:12', scene: 'kitchen' },
  { id: 'img-beach', name: '海滩动物合作场景', source: 'AI生成', type: '故事配图', size: '1024 × 1024', created: '2026/04/13 10:12:08', scene: 'beach' },
  { id: 'img-stage', name: '星光音乐会舞台', source: 'AI生成', type: '主题意境图', size: '1024 × 1024', created: '2026/04/13 10:15:44', scene: 'stage' },
  { id: 'img-rain', name: '救援地图插图', source: '手动上传', type: 'PPT素材', size: '1600 × 900', created: '2026/04/12 16:24:05', scene: 'rain' },
  { id: 'img-camp', name: '动物露营复盘图', source: 'AI生成', type: '故事配图', size: '1024 × 1024', created: '2026/04/12 15:48:33', scene: 'camp' },
  { id: 'img-card', name: 'apple 单词闪卡', source: 'AI生成', type: '闪卡', size: '1024 × 1024', created: '2026/04/11 09:20:18', scene: 'lantern' },
  { id: 'img-balloon', name: '情绪天气广播剧封面', source: '手动上传', type: '主题意境图', size: '1024 × 1024', created: '2026/04/10 18:30:42', scene: 'balloon' },
];

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

function imageAssetPrompt(asset) {
  if (asset.source !== 'AI生成') return '';
  if (asset.type === '闪卡') return '生成儿童友好的英文词汇闪卡，画面清晰、背景简洁，适合课堂展示和打印。';
  if (asset.type === '故事配图') return '生成神奇动物主题故事配图，童趣线条插画，角色友好，适合阅读材料与课堂讲述。';
  if (asset.type === 'PPT素材') return '生成适合 PPT 画布使用的课堂背景图，保留主体留白，画面温暖明亮。';
  return '生成神奇动物世界主题意境图，卡通插画风格，温暖色调，适合课程封面和课堂导入。';
}

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

function InfoRows({ rows }) {
  return (
    <div className="fr-img-info-list">
      {rows.map(([label, value]) => (
        <div className="fr-img-info-row" key={label}>
          <label>{label}</label>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

function AssetPreviewModal({ asset, open, onClose, onInsert, onViewTask }) {
  if (!asset) return null;
  const isAi = asset.source === 'AI生成';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={1040}
      className="fr-img-modal fr-img-preview-modal"
      closeIcon={<X size={22} />}
      title={(
        <div className="fr-img-detail-head">
          <div className="fr-img-modal-title">{asset.name}</div>
          <div className="fr-img-modal-tags">
            <Tag color="error">{asset.type}</Tag>
            <Tag>{asset.source}</Tag>
            <Tag>PNG</Tag>
          </div>
        </div>
      )}
    >
      <div className="fr-img-preview-body">
        <div className="fr-img-preview-art">
          <SceneArt scene={asset.scene} src={asset.previewUrl} alt={asset.name} />
        </div>
        <aside className="fr-img-preview-panel">
          <section>
            <h3>基础信息</h3>
            <InfoRows rows={[
              ['来源', asset.source],
              ['格式', 'PNG'],
              ['图片尺寸', asset.size],
              ['创建时间', asset.created],
            ]} />
          </section>
          <section>
            <h3>{isAi ? '生成信息' : '上传信息'}</h3>
            <InfoRows rows={isAi ? [
              ['生成提示词', imageAssetPrompt(asset)],
            ] : [
              ['上传者', 'Admin'],
              ['原文件名', `${asset.name.replace(/\s+/g, '_')}.png`],
              ['文件大小', '1.8 MB'],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-img-modal-footer">
        <Button onClick={onClose}>关闭</Button>
      </div>
    </Modal>
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

export function ImageLibrary() {
  const [assets, setAssets] = React.useState(IMAGE_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [insertAsset, setInsertAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);

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
    <section className="fr-img-lib">
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
              <Select value={source} onChange={setSource} options={sourceOptions} />
              <Select value={type} onChange={setType} options={typeOptions} />
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
        onInsert={(asset) => {
          setPreviewAsset(null);
          setInsertAsset(asset);
        }}
        onViewTask={() => message.info('已打开对应生成任务详情')}
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
