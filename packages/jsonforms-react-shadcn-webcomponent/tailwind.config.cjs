const animate = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../jsonforms-react-shadcn-renderers/src/**/*.{ts,tsx}',
    '../jsonforms-react-shadcn-extended-renderers/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: require('../jsonforms-react-shadcn-renderers/src/tailwind-theme.cjs'),
  },
  plugins: [animate],
};
