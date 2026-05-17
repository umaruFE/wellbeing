import { theme as antdTheme } from 'antd';

import lightColors from './design-tokens/colors/Light.tokens.json';
import darkColors from './design-tokens/colors/Dark.tokens.json';
import darkNeutralColors from './design-tokens/colors/Dark-neutral gray.tokens.json';

import dimDefault from './design-tokens/dimensions/Default.tokens.json';
import dimCompact from './design-tokens/dimensions/Compact.tokens.json';

import typoDefault from './design-tokens/typography/Default.tokens.json';
import typoCompact from './design-tokens/typography/Compact.tokens.json';

import componentTokens from './design-tokens/components/Value.tokens.json';

import { resolveColorPath } from './figmaResolve.js';
import { getButtonComponentTokensFromFigma } from './buttonTokensFromFigma.js';

/** 设计变量路径 → antd v5 Seed / 常用 Alias（与 Figma 命名对齐） */
const COLOR_PATHS = {
  colorPrimary: 'Colors.Brand.Primary.colorPrimary',
  colorPrimaryBg: 'Colors.Brand.Primary.colorPrimaryBg',
  colorPrimaryBgHover: 'Colors.Brand.Primary.colorPrimaryBgHover',
  colorPrimaryBorder: 'Colors.Brand.Primary.colorPrimaryBorder',
  colorPrimaryBorderHover: 'Colors.Brand.Primary.colorPrimaryBorderHover',
  colorPrimaryHover: 'Colors.Brand.Primary.colorPrimaryHover',
  colorPrimaryActive: 'Colors.Brand.Primary.colorPrimaryActive',

  colorSuccess: 'Colors.Brand.Success.colorSuccess',
  colorSuccessBg: 'Colors.Brand.Success.colorSuccessBg',
  colorSuccessBgHover: 'Colors.Brand.Success.colorSuccessBgHover',
  colorSuccessBorder: 'Colors.Brand.Success.colorSuccessBorder',
  colorSuccessBorderHover: 'Colors.Brand.Success.colorSuccessBorderHover',
  colorSuccessHover: 'Colors.Brand.Success.colorSuccessHover',
  colorSuccessActive: 'Colors.Brand.Success.colorSuccessActive',

  colorWarning: 'Colors.Brand.Warning.colorWarning',
  colorWarningBg: 'Colors.Brand.Warning.colorWarningBg',
  colorWarningBgHover: 'Colors.Brand.Warning.colorWarningBgHover',
  colorWarningBorder: 'Colors.Brand.Warning.colorWarningBorder',
  colorWarningBorderHover: 'Colors.Brand.Warning.colorWarningBorderHover',
  colorWarningHover: 'Colors.Brand.Warning.colorWarningHover',
  colorWarningActive: 'Colors.Brand.Warning.colorWarningActive',

  colorInfo: 'Colors.Brand.Info.colorInfo',
  colorInfoBg: 'Colors.Brand.Info.colorInfoBg',
  colorInfoBgHover: 'Colors.Brand.Info.colorInfoBgHover',
  colorInfoBorder: 'Colors.Brand.Info.colorInfoBorder',
  colorInfoBorderHover: 'Colors.Brand.Info.colorInfoBorderHover',
  colorInfoHover: 'Colors.Brand.Info.colorInfoHover',
  colorInfoActive: 'Colors.Brand.Info.colorInfoActive',

  colorError: 'Colors.Brand.Error.colorError',
  colorErrorBg: 'Colors.Brand.Error.colorErrorBg',
  colorErrorBgHover: 'Colors.Brand.Error.colorErrorBgHover',
  colorErrorBorder: 'Colors.Brand.Error.colorErrorBorder',
  colorErrorBorderHover: 'Colors.Brand.Error.colorErrorBorderHover',
  colorErrorHover: 'Colors.Brand.Error.colorErrorHover',
  colorErrorActive: 'Colors.Brand.Error.colorErrorActive',

  colorLink: 'Colors.Brand.Link.colorLink',
  colorLinkHover: 'Colors.Brand.Link.colorLinkHover',
  colorLinkActive: 'Colors.Brand.Link.colorLinkActive',

  colorTextBase: 'Colors.Neutral.colorTextBase',
  colorBgBase: 'Colors.Neutral.colorBgBase',
  colorText: 'Colors.Neutral.Text.colorText-1',
  colorTextSecondary: 'Colors.Neutral.Text.colorText-2',
  colorTextTertiary: 'Colors.Neutral.Text.colorText-3',
  colorTextQuaternary: 'Colors.Neutral.Text.colorText-3',
  colorTextDisabled: 'Colors.Neutral.Text.colorTextDisabled',

  colorBgContainer: 'Colors.Neutral.Bg.colorBgContainer',
  colorBgElevated: 'Colors.Neutral.Bg.colorBgElevated#',
  colorBgLayout: 'Colors.Neutral.Bg.colorBgLayout',
  colorBgSpotlight: 'Colors.Neutral.Bg.colorBgSpotlight',
  colorBgMask: 'Colors.Neutral.Bg.colorBgMask',

  colorBorder: 'Colors.Neutral.Border.colorBorder',
  colorBorderSecondary: 'Colors.Neutral.Border.colorBorderSecondary#',
  colorSplit: 'Colors.Neutral.Border.colorSplit',
};

/**
 * @param {Record<string, unknown>} doc
 * @param {string[]} keys
 */
function readNumberToken(doc, ...keys) {
  let n = doc;
  for (const k of keys) {
    n = /** @type {Record<string, unknown>} */ (n)?.[k];
  }
  if (n && typeof n === 'object' && typeof /** @type {{ $value?: unknown }} */ (n).$value === 'number') {
    return /** @type {{ $value: number }} */ (n).$value;
  }
  return undefined;
}

/**
 * @param {Record<string, unknown>} doc
 * @param {string[]} keys
 */
function readStringToken(doc, ...keys) {
  let n = doc;
  for (const k of keys) {
    n = /** @type {Record<string, unknown>} */ (n)?.[k];
  }
  if (!n || typeof n !== 'object') return undefined;
  
  const value = /** @type {{ $value?: unknown }} */ (n).$value;
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object' && value !== null && 'hex' in value) {
    return /** @type {{ hex: string }} */ (value).hex;
  }
  
  return undefined;
}

function buildColorTokenMap(colorRoot) {
  /** @type {Record<string, string>} */
  const token = {};
  for (const [antdKey, path] of Object.entries(COLOR_PATHS)) {
    const v = resolveColorPath(colorRoot, path);
    if (v != null) token[antdKey] = v;
  }
  return token;
}

/**
 * antd 全局 `lineHeight` 为无单位比例；Figma 常为像素。若把 22 写进 token，会变成 CSS `line-height: 22`（22×字号），单行可达数百 px。
 * @param {number | undefined} designValue
 * @param {number} fontSizePx
 */
function lineHeightToRatio(designValue, fontSizePx) {
  if (designValue == null || !fontSizePx) return undefined;
  if (designValue > 0 && designValue <= 3) return designValue;
  return Math.round((designValue / fontSizePx) * 1000) / 1000;
}

function getSegmentedComponentTokensFromFigma() {
  const segmentedComponent = componentTokens?.Components?.Segmented?.Component;
  const segmentedGlobal = componentTokens?.Components?.Segmented?.Global;
  if (!segmentedComponent) return {};

  const borderColor = readStringToken(segmentedComponent, 'borderColor') || '#333E4E';
  const lineWidth = readNumberToken(segmentedGlobal, 'lineWidth') || 1.5;

  return {
    itemSelectedBg: readStringToken(segmentedComponent, 'itemSelectedBg'),
    itemSelectedColor: readStringToken(segmentedComponent, 'itemSelectedColor'),
    itemHoverColor: readStringToken(segmentedComponent, 'itemHoverColor'),
    itemHoverBg: readStringToken(segmentedComponent, 'itemHoverBg'),
    itemColor: readStringToken(segmentedComponent, 'itemColor'),
    itemActiveBg: readStringToken(segmentedComponent, 'itemActiveBg'),
    borderColor,
    lineWidth,
  };
}

/**
 * @param {{ colorMode?: 'light' | 'dark' | 'darkNeutral'; density?: 'default' | 'compact' }} [options]
 */
export function buildAntdTheme(options = {}) {
  const colorMode = options.colorMode ?? 'light';
  const density = options.density ?? 'default';

  const colorDoc =
    colorMode === 'dark'
      ? darkColors
      : colorMode === 'darkNeutral'
        ? darkNeutralColors
        : lightColors;

  const dimDoc = density === 'compact' ? dimCompact : dimDefault;
  const typoDoc = density === 'compact' ? typoCompact : typoDefault;

  const colorRoot = { Colors: colorDoc.Colors };

  const algorithm =
    colorMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm;

  /** @type {Record<string, string | number>} */
  const token = {
    ...buildColorTokenMap(colorRoot),
    borderRadius: readNumberToken(dimDoc, 'Border Radius', 'borderRadius'),
    borderRadiusLG: readNumberToken(dimDoc, 'Border Radius', 'borderRadiusLG'),
    borderRadiusSM: readNumberToken(dimDoc, 'Border Radius', 'borderRadiusSM'),
    borderRadiusXS: readNumberToken(dimDoc, 'Border Radius', 'borderRadiusXS'),
    sizeStep: readNumberToken(dimDoc, 'Size', 'sizeStep'),
    sizeUnit: readNumberToken(dimDoc, 'Size', 'sizeUnit'),
    fontSize: readNumberToken(typoDoc, 'Typography', 'Font Size', 'fontSize'),
    fontSizeLG: readNumberToken(typoDoc, 'Typography', 'Font Size', 'fontSizeLG'),
    fontSizeSM: readNumberToken(typoDoc, 'Typography', 'Font Size', 'fontSizeSM'),
    lineHeight: readNumberToken(typoDoc, 'Typography', 'Line Height', 'lineHeight'),
    lineHeightLG: readNumberToken(typoDoc, 'Typography', 'Line Height', 'lineHeightLG'),
    lineHeightSM: readNumberToken(typoDoc, 'Typography', 'Line Height', 'lineHeightSM'),
    lineWidth: readNumberToken(dimDoc, 'Size', 'Line Width', 'lineWidth'),
  };

  const fontFamily = readStringToken(typoDoc, 'Typography', 'Font Family', 'fontFamily');
  if (fontFamily) {
    token.fontFamily = `${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`;
  }

  const fs = /** @type {number} */ (token.fontSize ?? 14);
  const fsLG = /** @type {number} */ (token.fontSizeLG ?? 16);
  const fsSM = /** @type {number} */ (token.fontSizeSM ?? 12);
  if (token.lineHeight != null) token.lineHeight = lineHeightToRatio(/** @type {number} */ (token.lineHeight), fs);
  if (token.lineHeightLG != null) token.lineHeightLG = lineHeightToRatio(/** @type {number} */ (token.lineHeightLG), fsLG);
  if (token.lineHeightSM != null) token.lineHeightSM = lineHeightToRatio(/** @type {number} */ (token.lineHeightSM), fsSM);

  Object.keys(token).forEach((k) => {
    if (token[k] === undefined) delete token[k];
  });

  const buttonComponent = getButtonComponentTokensFromFigma();
  const segmentedComponent = getSegmentedComponentTokensFromFigma();

  const components = {};
  if (Object.keys(buttonComponent).length) components.Button = buttonComponent;
  if (Object.keys(segmentedComponent).length) components.Segmented = segmentedComponent;

  return {
    algorithm,
    token,
    components,
  };
}

/** 默认：亮色 + Default 密度（与当前 Figma 导出一致） */
export const appAntdTheme = buildAntdTheme();
