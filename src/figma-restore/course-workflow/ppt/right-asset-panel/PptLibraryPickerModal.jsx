import React from 'react';
import { CirclePlus, Music, Play, Search, X } from 'lucide-react';
import { Button, Input, Modal, Pagination, Select, Tag, message } from 'antd';
import apiService from '../../../../services/api';
import { AssetPreviewModal } from '../../../image-library/AssetPreviewModal';
import { IMAGE_ASSETS, createImageTaskDetail, normalizeImageAsset } from '../../../image-library/ImageLibrary';
import { AudioPreviewModal } from '../../../audio-library/AudioPreviewModal';
import { AUDIO_ASSETS, createAudioTaskDetail, normalizeAudioAsset } from '../../../audio-library/AudioLibrary';
import { VideoPreviewModal } from '../../../video-library/VideoPreviewModal';
import { VIDEO_ASSETS, createVideoTaskDetail, normalizeVideoAsset } from '../../../video-library/VideoLibrary';
import { TaskDetailModal, createCanvasAssetPayload } from '../../../TaskDetailModal';

const modalTitleByType = {
  image: '选择图文素材',
  video: '选择视频素材',
  audio: '选择音频素材',
};

const searchPlaceholderByType = {
  image: '搜索图文素材',
  video: '搜索视频素材',
  audio: '搜索音频素材',
};

const assetSource = {
  image: IMAGE_ASSETS,
  video: VIDEO_ASSETS,
  audio: AUDIO_ASSETS,
};

const taskFactory = {
  image: createImageTaskDetail,
  video: createVideoTaskDetail,
  audio: createAudioTaskDetail,
};

function uniqueOptions(assets, key, fallback) {
  const values = Array.from(new Set(assets.map((asset) => asset[key]).filter(Boolean)));
  return [
    { label: fallback, value: '' },
    ...values.map((value) => ({ label: value, value })),
  ];
}

function ImageArt({ asset }) {
  if (asset.previewUrl) {
    return <img className="ppt-library-real-img" src={asset.previewUrl} alt={asset.name} />;
  }

  return (
    <div className={`fr-img-scene scene-${asset.scene}`}>
      <span className="shape orb a" />
      <span className="shape orb b" />
      <span className="shape orb c" />
      <span className="shape block d" />
    </div>
  );
}

function VideoArt({ asset }) {
  return (
    <div className={`fr-vid-frame tone-${asset.tone}`}>
      <Tag className="fr-vid-source-tag">{asset.source}</Tag>
      <span className="fr-vid-moon" />
      <span className="fr-vid-line line-a" />
      <span className="fr-vid-line line-b" />
      <span className="fr-vid-line line-c" />
      <span className="fr-vid-play"><Play size={28} fill="currentColor" /></span>
      <span className="fr-vid-duration">{asset.duration}</span>
    </div>
  );
}

function AudioArt({ asset }) {
  return (
    <div className={`fr-aud-wave tone-${asset.tone}`}>
      <Tag className="fr-aud-source-tag">{asset.source}</Tag>
      <div className="fr-aud-bars" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ height: `${30 + ((index * 17) % 54)}px` }} />
        ))}
      </div>
      <span className="fr-aud-play"><Music size={28} /></span>
      <span className="fr-aud-duration">{asset.duration}</span>
    </div>
  );
}

function AssetArt({ type, asset }) {
  if (type === 'video') return <VideoArt asset={asset} />;
  if (type === 'audio') return <AudioArt asset={asset} />;
  return <ImageArt asset={asset} />;
}

function getMeta(type, asset) {
  if (type === 'video') return `${asset.format} · ${asset.fileSize}`;
  if (type === 'audio') return `${asset.format} · ${asset.fileSize}`;
  return asset.size;
}

function getDateLine(type, asset) {
  if (type === 'video') return `${asset.source} · ${asset.created}`;
  if (type === 'audio') return `${asset.source} · ${asset.created}`;
  return `${asset.source} · ${asset.created}`;
}

function DetailModal({ type, asset, onClose, onViewTask }) {
  const [audioProgress] = React.useState({ assetId: null, current: 0, duration: 0 });

  if (type === 'video') {
    return (
      <VideoPreviewModal
        asset={asset}
        open={Boolean(asset)}
        onClose={onClose}
        onViewTask={onViewTask}
      />
    );
  }

  if (type === 'audio') {
    return (
      <AudioPreviewModal
        asset={asset}
        open={Boolean(asset)}
        onClose={onClose}
        playing={false}
        onTogglePlay={() => {}}
        progress={audioProgress}
        onViewTask={onViewTask}
      />
    );
  }

  return (
    <AssetPreviewModal
      asset={asset}
      open={Boolean(asset)}
      onClose={onClose}
      onViewTask={onViewTask}
    />
  );
}

export function PptLibraryPickerModal({ type, open, onClose, onInsert }) {
  const [loadedAssets, setLoadedAssets] = React.useState(assetSource[type] || assetSource.image);
  const assets = loadedAssets;
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [assetType, setAssetType] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(null);
  const [detailAsset, setDetailAsset] = React.useState(null);
  const [taskDetail, setTaskDetail] = React.useState(null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (!open) return;

    let alive = true;
    const request = type === 'video'
      ? apiService.getVideos({ limit: 200 }).then((result) => (result.data || []).map(normalizeVideoAsset))
      : type === 'audio'
        ? apiService.getVoiceConfigs().then((result) => (result.data || []).map(normalizeAudioAsset))
        : apiService.getPptImages({ limit: 200 }).then((result) => (result.data || []).map(normalizeImageAsset));

    request
      .then((items) => {
        if (alive) setLoadedAssets(items);
      })
      .catch((error) => {
        console.error('获取素材库失败:', error);
        if (alive) {
          setLoadedAssets([]);
          message.error('获取素材库失败');
        }
      });

    return () => {
      alive = false;
    };
  }, [open, type]);

  React.useEffect(() => {
    if (!open) return;
    setSearch('');
    setSource('');
    setAssetType('');
    setSelectedId(assets[0]?.id || null);
    setDetailAsset(null);
    setTaskDetail(null);
    setPage(1);
  }, [assets, open, type]);

  const filteredAssets = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const haystack = `${asset.name} ${asset.type} ${asset.source} ${asset.format || ''}`.toLowerCase();
      return (!keyword || haystack.includes(keyword))
        && (!source || asset.source === source)
        && (!assetType || asset.type === assetType);
    });
  }, [assetType, assets, search, source]);

  React.useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [assetType, open, search, source]);

  const visibleAssets = React.useMemo(() => {
    const pageSize = 9;
    return filteredAssets.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredAssets, page]);

  React.useEffect(() => {
    if (!open) return;
    if (!filteredAssets.some((asset) => asset.id === selectedId)) {
      setSelectedId(filteredAssets[0]?.id || null);
    }
  }, [filteredAssets, open, selectedId]);

  const selectedAsset = filteredAssets.find((asset) => asset.id === selectedId) || null;

  const insertAsset = (asset) => {
    if (!asset) return;
    const task = taskFactory[type]?.(asset);
    if (!task) return;
    onInsert?.(createCanvasAssetPayload(task));
    setDetailAsset(null);
    onClose?.();
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width="50vw"
        className={`ppt-library-modal ppt-library-modal-${type}`}
        closeIcon={<X size={16} />}
        title={(
          <div className="ppt-library-title-wrap">
            <div className="ppt-library-title">{modalTitleByType[type] || modalTitleByType.image}</div>
            <div className="ppt-library-subtitle">插入到：PPT 课件 / 当前画布</div>
          </div>
        )}
      >
        <div className="ppt-library-picker-body">
          <div className="ppt-library-toolbar">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholderByType[type] || searchPlaceholderByType.image}
              prefix={<Search size={16} />}
              allowClear
            />
            <Select
              value={source}
              onChange={setSource}
              options={uniqueOptions(assets, 'source', '全部来源')}
            />
            <Select
              value={assetType}
              onChange={setAssetType}
              options={uniqueOptions(assets, 'type', '全部类型')}
            />
          </div>

          <div className="ppt-library-grid">
            {visibleAssets.map((asset) => {
              const selected = selectedId === asset.id;
              return (
                <article
                  className={`ppt-library-card ${selected ? 'is-selected' : ''}`}
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                >
                  <button
                    type="button"
                    className="ppt-library-detail-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDetailAsset(asset);
                    }}
                  >
                    详情
                  </button>
                  <div className="ppt-library-thumb">
                    <AssetArt type={type} asset={asset} />
                  </div>
                  <div className="ppt-library-meta">
                    <div className="ppt-library-name">{asset.name}</div>
                    <div className="ppt-library-line">
                      <span className="ppt-library-type">{asset.type}</span>
                      <span>{getMeta(type, asset)}</span>
                    </div>
                    <div className="ppt-library-date">{getDateLine(type, asset)}</div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredAssets.length === 0 ? (
            <div className="ppt-library-empty">没有找到匹配素材</div>
          ) : null}

          <Pagination
            className="ppt-library-pager"
            current={page}
            pageSize={9}
            total={filteredAssets.length}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>

        <div className="ppt-library-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            className="ppt-library-insert-btn"
            disabled={!selectedAsset}
            icon={<CirclePlus size={15} />}
            onClick={() => insertAsset(selectedAsset)}
          >
            插入当前页
          </Button>
        </div>
      </Modal>

      <DetailModal
        type={type}
        asset={detailAsset}
        onClose={() => setDetailAsset(null)}
        onViewTask={(asset) => {
          const task = taskFactory[type]?.(asset);
          if (!task) return;
          setTaskDetail(task);
          setDetailAsset(null);
        }}
      />

      <TaskDetailModal
        task={taskDetail}
        open={Boolean(taskDetail)}
        onClose={() => setTaskDetail(null)}
        onInsertTaskAsset={(payload) => {
          onInsert?.(payload);
          setTaskDetail(null);
          onClose?.();
        }}
      />
    </>
  );
}
