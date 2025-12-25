/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        midnight: '#0F0F14',
        brandPurple: '#8A2BE2',
        brandPink: '#FF2D95',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8A2BE2 0%, #FF2D95 100%)',
      },
    },
  },
  plugins: [],
};
