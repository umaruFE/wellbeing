import { workbenchTokens as w } from './workbenchTokens.js';

// ============================================================
// Design Tokens — 自动从 Figma Design Tokens 导出整合
// 文件来源:
//   Default.tokens.json   → Size / Space / Border Radius
//   Default.tokens(1).json → Typography
//   Light.tokens.json      → Colors
// ============================================================

// -------------------------
// Colors (Light theme)
// -------------------------
export const colors = {
  // Shared neutral and primary tokens from the current integrated workbench.
  neutral: {
    white: w.surface, black: '#000000', transparent: 'rgba(0, 0, 0, 0)',
    text: { 1: w.text, 2: w.muted, 3: w.muted, disabled: w.placeholder, white: w.surface, heading: w.text, label: w.muted, description: w.muted, placeholder: w.placeholder },
    icon: { 1: w.text, 2: w.muted, 3: w.muted, 4: w.placeholder },
    bg: { base: w.surface, container: w.surface, elevated: w.surface, layout: w.page, mask: 'rgba(48,43,59,.4)', spotlight: w.text, containerDisabled: w.page, textActive: w.selected, textHover: w.page, borderBg: w.surface, solid: w.text, solidActive: w['primary-active'], solidHover: w['primary-hover'] },
    fill: { gray1: w.surface, gray2: w.page, gray3: w.selected, gray4: w.border, content: w.page, contentHover: w.selected, alter: w.page, alterSolid: w.page, handleBg: w.selected },
    border: { DEFAULT: w.border, split: w['border-soft'], secondary: w['border-soft'] },
  },
  brand: {
    DEFAULT: w.primary, bg: w.selected, bgHover: '#e9e0fc', border: w['selected-border'], borderHover: w.primary,
    hover: w['primary-hover'], active: w['primary-active'], text: w.primary, textHover: w['primary-hover'], textActive: w['primary-active'],
  },

  // ---- Brand Info (Blue) ----
  info: {
    DEFAULT: '#4482E5',
    bg: '#F0F8FF',
    bgHover: '#D9EBFF',
    border: '#C7E2FF',
    borderHover: '#9ECAFF',
    hover: '#6FA6F2',
    active: '#3062BF',
    text: '#4482E5',
    textHover: '#6FA6F2',
    textActive: '#3062BF',
  },

  // ---- Brand Success (Green) ----
  success: {
    DEFAULT: '#509F69',
    bg: '#EBF7EE',
    bgHover: '#DEFAE3',
    border: '#BDDDC2',
    borderHover: '#94C4A0',
    hover: '#71AB81',
    active: '#36784D',
    text: '#509F69',
    textHover: '#71AB81',
    textActive: '#36784D',
  },

  // ---- Brand Warning (Gold) ----
  warning: {
    DEFAULT: '#F5A233',
    bg: '#FFF4E5',
    bgHover: '#FFEDD4',
    border: '#FFE1B8',
    borderHover: '#FFD294',
    hover: '#FFC069',
    active: '#D38F31',
    text: '#F5A233',
    textHover: '#FFC069',
    textActive: '#D38F31',
    outline: 'rgba(255, 182, 84, 0.10)',
  },

  // ---- Brand Error (Red) ----
  error: {
    DEFAULT: '#CF474B',
    bg: '#FDECE8',
    bgHover: '#FFE1DA',
    border: '#FFC7BA',
    borderHover: '#FF9A85',
    hover: '#FF846A',
    active: '#A83037',
    text: '#CF474B',
    textHover: '#ED7975',
    textActive: '#A83037',
    outline: 'rgba(255, 95, 95, 0.06)',
  },

  // ---- Brand Link ----
  link: {
    DEFAULT: '#4482E5',
    hover: '#6FA6F2',
    active: '#3062BF',
  },

  // ---- Base Palette: Blue (1-10) ----
  blue: {
    1: '#F0F8FF', 2: '#D9EBFF', 3: '#C7E2FF', 4: '#9ECAFF', 5: '#6FA6F2',
    6: '#4482E5', 7: '#3062BF', 8: '#1F4599', 9: '#112D73', 10: '#0B1B4D',
  },

  // ---- Base Palette: Cyan (1-10) ----
  cyan: {
    1: '#F0FFFD', 2: '#E3FCFA', 3: '#B1F0EC', 4: '#84E3E0', 5: '#5AD6D6',
    6: '#35C4C9', 7: '#229BA3', 8: '#14727D', 9: '#0A4C57', 10: '#052930',
  },

  // ---- Base Palette: Geek Blue (1-10) ----
  geekBlue: {
    1: '#E4F0FF', 2: '#CCE2FF', 3: '#ADCEFF', 4: '#8AAFFD', 5: '#6687EE',
    6: '#455DDC', 7: '#3045B3', 8: '#213391', 9: '#162677', 10: '#0E1C63',
  },

  // ---- Base Palette: Gold (1-10) ----
  gold: {
    1: '#FFF4E5', 2: '#FFEDD4', 3: '#FFE1B8', 4: '#FFD294', 5: '#FFC069',
    6: '#F5A233', 7: '#D38F31', 8: '#B36E29', 9: '#8C4F19', 10: '#663611',
  },

  // ---- Base Palette: Green (1-10) ----
  green: {
    1: '#EBF7EE', 2: '#DEFAE3', 3: '#BDDDC2', 4: '#94C4A0', 5: '#71AB81',
    6: '#509F69', 7: '#36784D', 8: '#215233', 9: '#0F2B1B', 10: '#102316',
  },

  // ---- Base Palette: Lime (1-10) ----
  lime: {
    1: '#F7FFE6', 2: '#E2FAAF', 3: '#CAED7E', 4: '#B3E053', 5: '#A0D42F',
    6: '#8CC80B', 7: '#68A100', 8: '#4B7A00', 9: '#315400', 10: '#192E00',
  },

  // ---- Base Palette: Orange (1-10) ----
  orange: {
    1: '#FDECE8', 2: '#FFE1DA', 3: '#FFC7BA', 4: '#FF9A85', 5: '#FF846A',
    6: '#F4785E', 7: '#CF5846', 8: '#A83D31', 9: '#82261F', 10: '#5C1715',
  },

  // ---- Base Palette: Pink (1-10) ----
  pink: {
    1: '#FFF0F6', 2: '#FFE8F1', 3: '#FFBFDA', 4: '#F792C0', 5: '#E8639F',
    6: '#D53F8C', 7: '#B22D77', 8: '#9E1068', 9: '#780650', 10: '#700D52',
  },

  // ---- Base Palette: Purple (1-10) ----
  purple: {
    1: '#FAF0FF', 2: '#F3E4FD', 3: '#D7BEEB', 4: '#C29EDF', 5: '#B890DE',
    6: '#9966D0', 7: '#764BAB', 8: '#553485', 9: '#38205E', 10: '#201338',
  },

  // ---- Base Palette: Red (1-10) ----
  red: {
    1: '#FBE5E5', 2: '#FFD8D4', 3: '#FCAFA9', 4: '#F59E9E', 5: '#ED7975',
    6: '#CF474B', 7: '#A83037', 8: '#831F29', 9: '#641721', 10: '#55111A',
  },

  // ---- Base Palette: Volcano (1-10) ----
  volcano: {
    1: '#FFF6F0', 2: '#FFE5D5', 3: '#FFC0A1', 4: '#FFA078', 5: '#FF7E4F',
    6: '#F55524', 7: '#CF3A15', 8: '#A82308', 9: '#821100', 10: '#5C0900',
  },

  // ---- Base Palette: Yellow (1-10) ----
  yellow: {
    1: '#FEFFE8', 2: '#FFFFBF', 3: '#FFFB8F', 4: '#FFF45C', 5: '#FFEC28',
    6: '#FADB14', 7: '#D4B106', 8: '#AD8E00', 9: '#876800', 10: '#614700',
  },

  control: {
    itemBgActive: w.selected, itemBgActiveDisabled: w.page, itemBgActiveHover: '#e9e0fc', itemBgHover: w.page,
    outline: w['selected-border'], tmpOutline: w.selected, itemSelected: w.primary,
  },
};

// -------------------------
// Typography
// -------------------------
export const typography = {
  fontFamily: {
    default: w.font,
    code: '"Courier Prime", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  },

  fontSize: {
    icon: 12,
    sm: 12,
    DEFAULT: 14,
    lg: 16,
    xl: 20,
    heading1: 28,
    heading2: 24,
    heading3: 20,
    heading4: 18,
    heading5: 20,
    heading6: 16,
  },

  lineHeight: {
    sm: 20,
    DEFAULT: 22,
    lg: 24,
    heading1: 36,
    heading2: 32,
    heading3: 28,
    heading4: 26,
    heading5: 28,
    heading6: 24,
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    strong: 600,
  },
};

// -------------------------
// Size
// -------------------------
export const size = {
  step: 4,
  unit: 4,
  interactiveSize: 16,
  popupArrow: 16,

  base: {
    xxxs: 2,
    xxs: 4,
    xs: 8,
    sm: 12,
    DEFAULT: 16,
    ms: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  height: {
    xs: 16,
    sm: 36,
    DEFAULT: 40,
    lg: 44,
  },

  lineWidth: {
    DEFAULT: 1,
    bold: 2,
    focus: 4,
    controlOutline: 3,
  },

  screen: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  },
};

// -------------------------
// Space (Margin / Padding)
// -------------------------
export const space = {
  margin: {
    xxs: 4,
    xs: 8,
    sm: 12,
    DEFAULT: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  padding: {
    xxxs: 2,
    xxs: 4,
    xs: 8,
    sm: 12,
    DEFAULT: 16,
    md: 20,
    lg: 24,
    xl: 32,
    contentHorizontal: 16,
    contentHorizontalLg: 24,
    contentHorizontalSm: 16,
    contentVertical: 12,
    contentVerticalLg: 16,
    contentVerticalSm: 8,
    controlHorizontal: 12,
    controlHorizontalSm: 8,
  },
};

// -------------------------
// Border Radius
// -------------------------
export const borderRadius = {
  xs: 6,
  sm: 10,
  DEFAULT: 10,
  lg: 14,
  xxl: 18,
};

// -------------------------
// Shadows (derived from theme)
// -------------------------
export const shadows = {
  neo: 'none',
  neoHover: w['shadow-hover'],
  neoActive: 'none',
  subtle: `0 0 0 1px ${colors.neutral.border.secondary}`,
};

// -------------------------
// Card background classes (for course cards)
// -------------------------
export const cardBgClasses = [
  'bg-[#FDECE8]', 'bg-[#F0F8FF]', 'bg-[#FFF4E5]', 'bg-[#FAF0FF]',
  'bg-[#FBE5E5]', 'bg-[#EBF7EE]', 'bg-[#FFE1DA]', 'bg-[#D9EBFF]',
];

// -------------------------
// Convenience: flat color map for inline styles
// -------------------------
export const colorMap = {
  page: colors.neutral.bg.layout,
  surface: colors.neutral.fill.gray1,
  surfaceAlt: colors.neutral.fill.gray2,
  textPrimary: colors.neutral.text[1],
  textSecondary: colors.neutral.text[2],
  textMuted: colors.neutral.text[3],
  textPlaceholder: colors.neutral.text.disabled,
  border: colors.neutral.border.DEFAULT,
  borderLight: colors.neutral.border.secondary,
  borderSplit: colors.neutral.border.split,
  brand: colors.brand.DEFAULT,
  brandLight: colors.brand.bg,
  brandHover: colors.brand.hover,
  info: colors.info.DEFAULT,
  infoLight: colors.info.bg,
  success: colors.success.DEFAULT,
  successLight: colors.success.bg,
  warning: colors.warning.DEFAULT,
  warningLight: colors.warning.bg,
  error: colors.error.DEFAULT,
  errorLight: colors.error.bg,
  purple: colors.purple[6],
};
