(function (root, factory) {
  'use strict';
  const api = factory();
  api.factory = factory;
  if (typeof module === 'object' && module.exports) module.exports = Object.freeze(api);
  else root.DoodleWordImages = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_SOURCE_LENGTH = 300000;
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const WORD = /^[a-z]+(?:[-'][a-z]+)*$/;
  const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  const keyFor = value => typeof value === 'string' ? value.trim().toLowerCase() : '';

  function remoteSource(src) {
    if (typeof src !== 'string' || src.length > 4096 || /[\s\\]/.test(src)) return '';
    if (/^\/(?:uploads|api\/media|api\/ai\/serve-image)\//.test(src)) return src;
    try {
      const url = new URL(src);
      if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
    } catch (_) { /* Skip invalid remote sources. */ }
    return '';
  }

  function imageValue(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (value.kind === 'demo' && Number.isInteger(value.variant) && value.variant >= 0 && value.variant <= 2) {
      return {kind: 'demo', variant: value.variant};
    }
    if (value.kind === 'upload' || value.kind === 'ai') {
      const src = remoteSource(value.src);
      if (src) return {kind: value.kind, src};
      if (typeof value.src === 'string' && value.src.length <= MAX_SOURCE_LENGTH
        && value.src.indexOf(',') < value.src.length - 1 && DATA_IMAGE.test(value.src)) return {kind: value.kind, src: value.src};
    }
    return null;
  }

  function normalize(map, words) {
    if (!map || typeof map !== 'object' || Array.isArray(map) || !Array.isArray(words)) return {};
    const allowed = new Set(words.map(keyFor).filter(word => WORD.test(word)));
    const images = new Map();
    for (const [rawKey, value] of Object.entries(map)) {
      const key = keyFor(rawKey), image = allowed.has(key) && imageValue(value);
      if (image) images.set(key, image);
    }
    // Follow word order so merely reordering map keys cannot dirty a snapshot.
    return Object.fromEntries([...allowed].filter(key => images.has(key)).map(key => [key, images.get(key)]));
  }

  function validateFile(file) {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      throw new Error('请选择 PNG、JPEG 或 WebP 图片。');
    }
    if (!Number.isFinite(file.size) || file.size <= 0) throw new Error('图片文件为空或无法读取，请重新选择。');
    if (file.size > MAX_FILE_BYTES) throw new Error('图片不能超过 5 MB，请压缩后重新上传。');
  }

  async function fromFile(file) {
    validateFile(file);
    if (typeof Image !== 'function' || typeof document === 'undefined' || typeof document.createElement !== 'function'
      || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new Error('当前浏览器无法处理图片，请换用支持图片上传的浏览器。');
    }
    let url;
    try {
      url = URL.createObjectURL(file);
      const decoded = await new Promise((resolve, reject) => {
        const picture = new Image();
        picture.onload = () => resolve(picture);
        picture.onerror = () => reject(new Error('图片已损坏或无法解码，请选择其他图片。'));
        picture.src = url;
      });
      const width = decoded.naturalWidth, height = decoded.naturalHeight;
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error('图片尺寸无效，请选择其他图片。');
      }
      const scale = Math.min(1, 512 / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('当前浏览器无法处理图片，请重新打开页面。');
      context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
      const src = canvas.toDataURL('image/webp', 0.8);
      if (src.length > MAX_SOURCE_LENGTH) throw new Error('压缩后的图片仍然过大，请裁剪图片或选择更简单的图片。');
      if (!src.startsWith('data:image/webp;base64,') || !imageValue({kind: 'upload', src})) {
        throw new Error('图片压缩失败，请选择其他图片或更新浏览器。');
      }
      return {kind: 'upload', src};
    } catch (error) {
      if (error instanceof Error && /[\u3400-\u9fff]/.test(error.message)) throw error;
      throw new Error('无法读取或压缩这张图片，请选择其他图片。');
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }

  return {normalize, fromFile, validateFile, MAX_SOURCE_LENGTH, MAX_FILE_BYTES};
});
