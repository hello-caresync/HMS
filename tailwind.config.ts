import type { Config } from 'tailwindcss';

/**
 * CuraSync Hospital — Warm Nude Champagne & Dark Charcoal brand system.
 * Consumed via `@config` in app/globals.css (Tailwind CSS v4).
 */
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        hubBackground: '#FDF4F2',
        hubBorder: '#F5D5CF',
        blush: {
          canvas: '#FDF4F2',
          rose: '#D48D82',
          roseHover: '#C57E73',
          roseLight: '#E0A89F',
          silk: '#FCEEEB',
          silkBorder: '#F5D5CF',
          silkText: '#A65E53',
        },
        gold: {
          50: '#FEFBE8',
          100: '#FEF3C7',
          500: '#EAB308',
          600: '#D97706',
          700: '#B45309',
        },
        primary: {
          DEFAULT: '#D97706',
          foreground: '#FFFFFF',
          hover: '#B45309',
          muted: '#FEF3C7',
          accent: '#EAB308',
          canvas: '#FEFBE8',
        },
        sidebar: {
          canvas: '#0F172A',
          panel: '#1E293B',
        },
        obsidian: '#0F172A',
        /** Nexora Patient App — Rose Coral */
        patient: {
          primary: '#f47c8c',
          'primary-hover': '#e06373',
          light: '#fde8eb',
          border: '#f0d8dc',
          heading: '#8c2b39',
          muted: '#736366',
          canvas: '#faf6f7',
          emergency: '#e63946',
        },
      },
      boxShadow: {
        '3xs': '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
