import componentsValue from './design-tokens/components/Value.tokens.json';
import lightColors from './design-tokens/colors/Light.tokens.json';
import dimDefault from './design-tokens/dimensions/Default.tokens.json';

import { mergeTokenRootForResolve, resolveDesignTokenLeaf } from './figmaResolve.js';

function readNumberLeaf(doc, ...keys) {
  let n = doc;
  for (const k of keys) {
    n = /** @type {Record<string, unknown>} */ (n)?.[k];
  }
  if (n && typeof n === 'object' && typeof /** @type {{ $type?: string; $value?: unknown }} */ (n).$value === 'number') {
    return /** @type {{ $value: number }} */ (n).$value;
  }
  return undefined;
}

function primaryShadowFromButtonGlobal(globalRaw, root) {
  if (!globalRaw || typeof globalRaw !== 'object') return undefined;
  const g = /** @type {Record<string, unknown>} */ (globalRaw);
  const owBtn = resolveDesignTokenLeaf(g.controlOutlineWidth, root);
  const owDim = readNumberLeaf(dimDefault, 'Size', 'Line Width', 'controlOutlineWidth');
  const shadowColor = resolveDesignTokenLeaf(g.colorText, root);
  const ox = typeof owDim === 'number' ? owDim : owBtn;
  const oy = typeof owBtn === 'number' ? owBtn : owDim;
  if (typeof ox === 'number' && typeof oy === 'number' && typeof shadowColor === 'string') {
    return `${ox}px ${oy}px 0 0 ${shadowColor}`;
  }
  return undefined;
}

export function getButtonComponentTokensFromFigma() {
  const button = /** @type {Record<string, Record<string, unknown>> | undefined} */ (
    componentsValue.Components?.Button
  );
  
  if (!button) return {};
  
  const comp = button.Component;
  const globalRaw = button.Global;
  
  if (!comp || typeof comp !== 'object') return {};

  const root = mergeTokenRootForResolve(lightColors, componentsValue);
  /** @type {Record<string, string | number>} */
  const out = {};

  for (const [key, node] of Object.entries(comp)) {
    const v = resolveDesignTokenLeaf(node, root);
    if (v !== undefined) out[key] = v;
  }

  if (globalRaw && typeof globalRaw === 'object') {
    const globalTokens = /** @type {Record<string, unknown>} */ (globalRaw);
    const globalKeysToInclude = [
      'colorPrimary',
      'colorPrimaryHover',
      'colorPrimaryActive',
      'colorPrimaryBg',
      'colorPrimaryBorder',
      'colorError',
      'colorErrorHover',
      'colorErrorActive',
      'colorErrorBg',
      'colorErrorBorderHover',
      'colorLink',
      'colorLinkHover',
      'colorLinkActive',
      'colorText',
      'colorTextDisabled',
      'colorTextLightSolid',
      'colorBgContainer',
      'colorBgContainerDisabled',
      'colorBgTextActive',
      'colorBgSolid',
      'colorBgSolidHover',
      'colorBgSolidActive',
      'colorBorder',
      'controlHeight',
      'controlHeightSM',
      'controlHeightLG',
      'borderRadius',
      'borderRadiusSM',
      'borderRadiusLG',
      'lineWidth',
      'lineWidthFocus',
      'controlOutlineWidth',
      'controlOutline',
    ];

    for (const key of globalKeysToInclude) {
      if (!out[key]) {
        const v = resolveDesignTokenLeaf(globalTokens[key], root);
        if (v !== undefined) out[key] = v;
      }
    }
  }

  const pairs = [
    ['contentLineHeight', 'contentFontSize'],
    ['contentLineHeightLG', 'contentFontSizeLG'],
    ['contentLineHeightSM', 'contentFontSizeSM'],
  ];
  for (const [lhKey, fsKey] of pairs) {
    const lh = out[lhKey];
    const fs = out[fsKey];
    if (typeof lh === 'number' && typeof fs === 'number' && lh > 3) {
      out[lhKey] = Math.round((lh / fs) * 1000) / 1000;
    }
  }

  if (typeof out.primaryShadow !== 'string' || !out.primaryShadow.trim()) {
    const explicit =
      globalRaw && typeof globalRaw === 'object'
        ? resolveDesignTokenLeaf(/** @type {Record<string, unknown>} */ (globalRaw).primaryShadow, root)
        : undefined;
    if (typeof explicit === 'string' && explicit.trim()) {
      out.primaryShadow = explicit.trim();
    } else {
      const built = primaryShadowFromButtonGlobal(globalRaw, root);
      if (built) out.primaryShadow = built;
    }
  }

  const colorBgSolid = out.colorBgSolid;
  const colorBgSolidHover = out.colorBgSolidHover;
  const colorBgSolidActive = out.colorBgSolidActive;
  const colorTextLightSolid = out.colorTextLightSolid;

  if (typeof colorBgSolid === 'string') {
    out.solidBg = colorBgSolid;
    out.solidHoverBg = colorBgSolidHover || colorBgSolid;
    out.solidActiveBg = colorBgSolidActive || colorBgSolid;
    out.solidColor = colorTextLightSolid || '#ffffff';
  }

  if (!out.defaultShadow) {
    out.defaultShadow = '3px 3px 0px 0px rgba(0, 0, 0, 0.15)';
  }

  if (!out.ghostShadow) {
    out.ghostShadow = out.defaultShadow;
  }

  const defaultBorderColor = out.defaultBorderColor;
  if (typeof defaultBorderColor === 'string') {
    out.borderColor = defaultBorderColor;
    out.borderColorHover = out.defaultHoverBorderColor || defaultBorderColor;
    out.borderColorActive = out.defaultActiveBorderColor || defaultBorderColor;
  }

  const defaultColor = out.defaultColor;
  if (typeof defaultColor === 'string') {
    out.color = defaultColor;
    out.colorHover = out.defaultHoverColor || defaultColor;
    out.colorActive = out.defaultActiveColor || defaultColor;
  }

  const defaultBg = out.defaultBg;
  if (typeof defaultBg === 'string') {
    out.bg = defaultBg;
    out.bgHover = out.defaultHoverBg || defaultBg;
    out.bgActive = out.defaultActiveBg || defaultBg;
  }

  return out;
}