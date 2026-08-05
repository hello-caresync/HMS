import type { Config } from 'tailwindcss';

/**
 * Nexora Doctor App — Sage & Cream enterprise clinical workstation
 */
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        doctor: {
          sage: '#7A9A8B',
          text: '#2C3531',
          linen: '#F4F6F0',
          cream: '#FAFCF8',
          dusty: '#D8E2DC',
          border: '#E2E8E0',
          success: '#4A856A',
          'success-bg': '#EEF5F1',
          warning: '#D96B52',
          'warning-bg': '#FDF0ED',
          pending: '#9A8938',
          'pending-bg': '#F8F6E9',
        },
        'brand-primary': '#7A9A8B',
        'brand-hover': '#6B8A7C',
        'brand-secondary': '#D8E2DC',
        'brand-light': '#EEF5F1',
        'brand-surface': '#FAFCF8',
        'brand-bg': '#F4F6F0',
        'brand-text': '#2C3531',
        brand: {
          DEFAULT: '#7A9A8B',
          primary: '#7A9A8B',
          hover: '#6B8A7C',
          secondary: '#D8E2DC',
          light: '#EEF5F1',
          surface: '#FAFCF8',
          bg: '#F4F6F0',
          text: '#2C3531',
        },
        hubBackground: '#F4F6F0',
        hubBorder: '#E2E8E0',
      },
      boxShadow: {
        '3xs': '0 1px 2px 0 rgb(43 42 34 / 0.04)',
        xs: '0 1px 2px 0 rgb(43 42 34 / 0.06)',
        sage: '0 4px 24px -4px rgb(163 158 117 / 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
