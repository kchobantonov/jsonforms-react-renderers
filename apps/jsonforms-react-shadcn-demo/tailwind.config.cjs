const animate = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/jsonforms-react-shadcn-renderers/src/**/*.{ts,tsx}',
    '../../packages/jsonforms-react-shadcn-extended-renderers/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: require('../../packages/jsonforms-react-shadcn-renderers/src/tailwind-theme.cjs'),
  },
  plugins: [animate],
};
