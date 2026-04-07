/**
 * 计算角色图「有效内容」包围盒（忽略接近纯白背景与全透明像素），
 * 用于在画布上按统一视觉高度缩放，避免有的 IP 画得小、有的画得大。
 */
export function getImageContentBounds(imageElement, options = {}) {
  const minAlpha = options.minAlpha ?? 12;
  const whiteThreshold = options.whiteThreshold ?? 245;
  const w = imageElement.naturalWidth || imageElement.width;
  const h = imageElement.naturalHeight || imageElement.height;
  if (!w || !h) return { x: 0, y: 0, w: 1, h: 1 };

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return { x: 0, y: 0, w, h };

  ctx.drawImage(imageElement, 0, 0);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return { x: 0, y: 0, w, h };
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const nearWhite =
        r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
      if (a > minAlpha && !nearWhite) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX) {
    return { x: 0, y: 0, w, h };
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1
  };
}

/** 编辑器画布上场景区域相对最终输出尺寸的缩放与偏移 */
export function getEditorSceneLayout(canvasWidth, canvasHeight, aspectRatio) {
  const scale = Math.min(
    canvasWidth / aspectRatio.width,
    canvasHeight / aspectRatio.height
  );
  const sceneW = aspectRatio.width * scale;
  const sceneH = aspectRatio.height * scale;
  return {
    editorScale: scale,
    sceneW,
    sceneH,
    offsetX: (canvasWidth - sceneW) / 2,
    offsetY: (canvasHeight - sceneH) / 2
  };
}

/** 角色内容高度占场景短边的比例（统一视觉大小） */
export const ROLE_CONTENT_HEIGHT_FRACTION = 0.38;

/**
 * 根据内容包围盒计算绘制尺寸（编辑器坐标系下 dw, dh）
 */
export function getNormalizedRoleDrawSize(bounds, sceneW, sceneH, userScale = 1) {
  const shortSide = Math.min(sceneW, sceneH);
  const targetContentH = ROLE_CONTENT_HEIGHT_FRACTION * shortSide * userScale;
  if (!bounds.h) return { dw: 0, dh: 0, scale: 0 };
  const s = targetContentH / bounds.h;
  return {
    dw: bounds.w * s,
    dh: bounds.h * s,
    scale: s
  };
}
