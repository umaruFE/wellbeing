/**
 * 解析 Figma 导出的 Design Tokens：$value 可能是 "{Colors....}" 引用或带 hex/alpha 的对象。
 */

function getByDotPath(root, dotPath) {
  const parts = dotPath.split('.');
  let cur = root;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

/**
 * @param {Record<string, unknown>} root 至少包含 Colors 树（如 { Colors: {...} }）
 * @param {unknown} rawValue
 * @param {Set<string>} [visiting]
 * @returns {string | undefined}
 */
export function resolveFigmaColorValue(root, rawValue, visiting = new Set()) {
  if (rawValue == null) return undefined;
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    const ref = trimmed.match(/^\{([^}]+)\}$/);
    if (ref) {
      const inner = ref[1];
      if (visiting.has(inner)) return undefined;
      visiting.add(inner);
      const node = getByDotPath(root, inner);
      if (!node || typeof node !== 'object') {
        visiting.delete(inner);
        return undefined;
      }
      const out = resolveFigmaColorNode(root, node, visiting);
      visiting.delete(inner);
      return out;
    }
    return trimmed;
  }
  if (typeof rawValue === 'object' && rawValue !== null && 'hex' in rawValue) {
    const { hex, alpha } = /** @type {{ hex: string; alpha?: number }} */ (rawValue);
    if (typeof alpha === 'number' && alpha > 0 && alpha < 1 && typeof hex === 'string') {
      const m = hex.match(/^#([0-9a-fA-F]{6})$/);
      if (m) {
        const r = parseInt(m[1].slice(0, 2), 16);
        const g = parseInt(m[1].slice(2, 4), 16);
        const b = parseInt(m[1].slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    return typeof hex === 'string' ? hex : undefined;
  }
  return undefined;
}

/**
 * @param {Record<string, unknown>} root
 * @param {unknown} node
 * @param {Set<string>} visiting
 */
function resolveFigmaColorNode(root, node, visiting) {
  if (!node || typeof node !== 'object') return undefined;
  if (/** @type {{ $type?: string }} */ (node).$type === 'color' && '$value' in /** @type {object} */ (node)) {
    return resolveFigmaColorValue(root, /** @type {{ $value: unknown }} */ (node).$value, visiting);
  }
  return undefined;
}

/**
 * @param {Record<string, unknown>} root
 * @param {string} dotPath 例如 Colors.Brand.Primary.colorPrimary
 */
export function resolveColorPath(root, dotPath) {
  const node = getByDotPath(root, dotPath);
  return resolveFigmaColorNode(root, node, new Set());
}

/**
 * 合并解析根：支持 Colors.* 与 Components.* 的 {路径} 互引用
 * @param {Record<string, unknown>} colorsDoc
 * @param {Record<string, unknown>} componentsDoc
 */
export function mergeTokenRootForResolve(colorsDoc, componentsDoc) {
  return {
    Colors: colorsDoc.Colors,
    Components: componentsDoc.Components,
  };
}

/**
 * @param {Record<string, unknown>} root
 * @param {unknown} rawValue
 * @param {Set<string>} [visiting]
 */
function resolveFigmaNumberValue(root, rawValue, visiting = new Set()) {
  if (typeof rawValue === 'number' && !Number.isNaN(rawValue)) return rawValue;
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    const ref = trimmed.match(/^\{([^}]+)\}$/);
    if (ref) {
      const inner = ref[1];
      if (visiting.has(inner)) return undefined;
      visiting.add(inner);
      const node = getByDotPath(root, inner);
      let out;
      if (node && typeof node === 'object' && /** @type {{ $type?: string }} */ (node).$type === 'number') {
        out = resolveFigmaNumberValue(root, /** @type {{ $value: unknown }} */ (node).$value, visiting);
      }
      visiting.delete(inner);
      return out;
    }
  }
  return undefined;
}

/**
 * 解析 Figma 叶子 token（color / number / string）
 * @param {Record<string, unknown>} root
 * @param {unknown} node
 * @returns {string | number | undefined}
 */
export function resolveDesignTokenLeaf(node, root) {
  if (!node || typeof node !== 'object') return undefined;
  const t = /** @type {{ $type?: string; $value?: unknown }} */ (node).$type;
  const v = /** @type {{ $type?: string; $value?: unknown }} */ (node).$value;
  if (t === 'color') return resolveFigmaColorValue(root, v, new Set());
  if (t === 'number') return resolveFigmaNumberValue(root, v, new Set());
  if (t === 'string' && typeof v === 'string') return v;
  return undefined;
}
