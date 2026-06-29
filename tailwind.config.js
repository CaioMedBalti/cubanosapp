/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // dark-luxury
        'dl-bg': '#0d0a08',
        'dl-surface': '#1a1209',
        'dl-card': '#241a0f',
        'dl-accent': '#EF9F27',
        'dl-accent-dim': '#c9a84c',
        'dl-text': '#f0e6d3',
        'dl-text-muted': '#8b7355',
        'dl-border': '#3d2b1a',
        // vintage
        'vt-bg': '#241a0d',
        'vt-surface': '#3a2a18',
        'vt-card': '#4a3520',
        'vt-accent': '#c8a26b',
        'vt-accent-dim': '#8b6540',
        'vt-text': '#f5e6c8',
        'vt-text-muted': '#7a6040',
        'vt-border': '#4a3520',
        // modern
        'md-bg': '#111111',
        'md-surface': '#1d1d1d',
        'md-card': '#252525',
        'md-accent': '#e07830',
        'md-accent-dim': '#b85c20',
        'md-text': '#e0e0e0',
        'md-text-muted': '#666666',
        'md-border': '#2a2a2a',
      },
    },
  },
  plugins: [],
};
