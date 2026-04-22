import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F2',
        peach: {
          50: '#FEF2EA',
          100: '#FCE4D5',
          200: '#F8C9AE',
          300: '#F4AE87',
          400: '#EE9664',
          500: '#E07B49',
        },
        sage: {
          50: '#EFF4EC',
          100: '#DCE8D5',
          200: '#BED3B4',
          300: '#9ABE92',
          400: '#7BA774',
          500: '#5A8855',
        },
        mauve: {
          50: '#F7EFF3',
          100: '#EBDCE5',
          200: '#D9B8C9',
          300: '#C294AC',
          400: '#A76F8C',
        },
        butter: {
          100: '#FDF3D3',
          200: '#F9E39A',
          300: '#F3CE5F',
        },
        ink: {
          DEFAULT: '#3D2E26',
          soft: '#6B5A50',
          mute: '#9C8B80',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 18px rgba(61, 46, 38, 0.06)',
        bubble: '0 8px 28px rgba(224, 123, 73, 0.15)',
      },
      borderRadius: {
        bubble: '28px',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'pop': 'pop 0.3s ease',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pop: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
export default config;
