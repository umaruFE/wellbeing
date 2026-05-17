/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        page: '#F7F5F1',
        surface: {
          DEFAULT: '#FCFBF9',
          alt: '#F7F5F1',
        },
        primary: {
          DEFAULT: '#333E4E',
          secondary: '#575F6E',
          muted: '#818997',
          placeholder: '#A4ABB8',
        },
        stroke: {
          DEFAULT: '#EFECE8',
          light: '#E6E3DE',
          subtle: '#F5F2EE',
        },
        brand: {
          DEFAULT: '#F4785E',
          light: '#FDECE8',
          accent: '#FFE1DA',
          border: '#FFC7BA',
          hover: '#FF846A',
          active: '#CF5846',
          dark: '#CF5846',
        },
        info: {
          DEFAULT: '#4482E5',
          light: '#F0F8FF',
          border: '#C7E2FF',
          hover: '#6FA6F2',
          active: '#3062BF',
          icon: '#6FA6F2',
        },
        success: {
          DEFAULT: '#509F69',
          light: '#EBF7EE',
          border: '#BDDDC2',
          hover: '#71AB81',
          active: '#36784D',
        },
        warning: {
          DEFAULT: '#F5A233',
          light: '#FFF4E5',
          border: '#FFE1B8',
          hover: '#FFC069',
          active: '#D38F31',
        },
        error: {
          DEFAULT: '#CF474B',
          light: '#FDECE8',
          border: '#FFC7BA',
          hover: '#FF846A',
          active: '#A83037',
        },
        purple: {
          DEFAULT: '#9966D0',
          light: '#FAF0FF',
        },
        card: {
          1: '#FDECE8',
          2: '#F0F8FF',
          3: '#FFF4E5',
          4: '#FAF0FF',
          5: '#FBE5E5',
          6: '#EBF7EE',
          7: '#FFE1DA',
          8: '#D9EBFF',
        },
      },
      fontFamily: {
        harmony: ['"HarmonyOS Sans SC"', 'sans-serif'],
        code: ['"Courier Prime"', 'monospace'],
      },
      fontSize: {
        'heading-1': ['48px', { lineHeight: '56px' }],
        'heading-2': ['36px', { lineHeight: '46px' }],
        'heading-3': ['30px', { lineHeight: '38px' }],
        'heading-4': ['24px', { lineHeight: '32px' }],
        'heading-5': ['20px', { lineHeight: '28px' }],
        'heading-6': ['16px', { lineHeight: '24px' }],
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        lg: '8px',
        xxl: '10px',
      },
      boxShadow: {
        'neo': '2px 2px 0px 0px #333E4E',
        'neo-hover': '3px 3px 0px 0px #333E4E',
        'neo-active': '1px 1px 0px 0px #333E4E',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
