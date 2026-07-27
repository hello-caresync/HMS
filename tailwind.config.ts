import type { Config } from 'tailwindcss';

/**
 * Nexora Doctor App — Sage & Cream enterprise clinical workstation
 */
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#A39E75',
        'brand-hover': '#8E8963',
        'brand-secondary': '#C7C39E',
        'brand-light': '#E6E3C5',
        'brand-surface': '#F7F6E8',
        'brand-bg': '#FAFAF5',
        'brand-text': '#2B2A22',
        brand: {
          DEFAULT: '#A39E75',
          primary: '#A39E75',
          hover: '#8E8963',
          secondary: '#C7C39E',
          light: '#E6E3C5',
          surface: '#F7F6E8',
          bg: '#FAFAF5',
          text: '#2B2A22',
        },
        hubBackground: '#FAFAF5',
        hubBorder: '#E6E3C5',
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
