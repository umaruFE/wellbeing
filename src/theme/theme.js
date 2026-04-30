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
  // ---- Neutral ----
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'rgba(0, 0, 0, 0)',

    text: {
      1: '#333E4E',
      2: '#575F6E',
      3: '#818997',
      disabled: '#A4ABB8',
      white: '#FFFFFF',
      heading: '#333E4E',
      label: '#575F6E',
      description: '#818997',
      placeholder: '#A4ABB8',
    },

    icon: {
      1: '#333E4E',
      2: '#575F6E',
      3: '#818997',
      4: '#A4ABB8',
    },

    bg: {
      base: '#FFFFFF',
      container: '#FFFFFF',
      elevated: '#FFFFFF',
      layout: '#F7F5F1',
      mask: 'rgba(0, 0, 0, 0.45)',
      spotlight: 'rgba(0, 0, 0, 0.85)',
      containerDisabled: '#DFDFDF',
      textActive: '#DFDFDF',
      textHover: '#EFECE6',
      borderBg: '#FFFFFF',
      solid: '#000000',
      solidActive: 'rgba(0, 0, 0, 0.95)',
      solidHover: 'rgba(0, 0, 0, 0.75)',
    },

    fill: {
      gray1: '#FCFBF9',
      gray2: '#F7F5F1',
      gray3: '#EFECE6',
      gray4: '#DFDFDF',
      content: '#EFECE6',
      contentHover: '#DFDFDF',
      alter: '#FCFBF9',
      alterSolid: '#FCFAF7',
      handleBg: '#EFECE6',
    },

    border: {
      DEFAULT: '#E6E3DE',
      split: '#F5F2EE',
      secondary: '#EFECE8',
    },
  },

  // ---- Brand Primary (Orange) ----
  brand: {
    DEFAULT: '#F4785E',
    bg: '#FDECE8',
    bgHover: '#FFE1DA',
    border: '#FFC7BA',
    borderHover: '#FF9A85',
    hover: '#FF846A',
    active: '#CF5846',
    text: '#F4785E',
    textHover: '#FF846A',
    textActive: '#CF5846',
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

  // ---- Control ----
  control: {
    itemBgActive: '#FDECE8',
    itemBgActiveDisabled: '#DFDFDF',
    itemBgActiveHover: '#FFE1DA',
    itemBgHover: '#F7F5F1',
    outline: 'rgba(5, 145, 255, 0.10)',
    tmpOutline: 'rgba(0, 0, 0, 0.02)',
    itemSelected: '#F4785E',
  },
};

// -------------------------
// Typography
// -------------------------
export const typography = {
  fontFamily: {
    default: '"HarmonyOS Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    code: '"Courier Prime", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  },

  fontSize: {
    icon: 12,
    sm: 12,
    DEFAULT: 14,
    lg: 16,
    xl: 20,
    heading1: 48,
    heading2: 36,
    heading3: 30,
    heading4: 24,
    heading5: 20,
    heading6: 16,
  },

  lineHeight: {
    sm: 20,
    DEFAULT: 22,
    lg: 24,
    heading1: 56,
    heading2: 46,
    heading3: 38,
    heading4: 32,
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
    sm: 24,
    DEFAULT: 32,
    lg: 40,
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
  xs: 2,
  sm: 4,
  DEFAULT: 6,
  lg: 8,
  xxl: 10,
};

// -------------------------
// Shadows (derived from theme)
// -------------------------
export const shadows = {
  neo: '2px 2px 0px 0px #333E4E',
  neoHover: '3px 3px 0px 0px #333E4E',
  neoActive: '1px 1px 0px 0px #333E4E',
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
