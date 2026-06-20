import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cddccd',
          300: '#aac4ab',
          400: '#83a685',
          500: '#638b66',
          600: '#4d7050',
          700: '#3f5a42',
          800: '#354a38',
          900: '#2d3e2f',
        },
        sky: {
          50: '#f3f8fb',
          100: '#e3eef5',
          200: '#c4dded',
          300: '#9bc4de',
          400: '#6ea6cb',
          500: '#4d89b3',
          600: '#3a6e96',
          700: '#32597a',
          800: '#2d4a64',
          900: '#283e54',
        },
        clay: {
          50: '#fdf8f4',
          100: '#f9ece1',
          200: '#f1d6bf',
          300: '#e6b893',
          400: '#d99765',
          500: '#cb7c46',
        },
      },
      fontFamily: {
        sans: [
          'Nunito',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 16px rgba(45, 62, 47, 0.08)',
        softer: '0 1px 8px rgba(45, 62, 47, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
