import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0b09',
        card: '#161311',
        hairline: 'rgba(212, 163, 115, 0.15)',
        gold: {
          DEFAULT: '#d4a373',
          light: '#e2b17a',
          dark: '#b37d4e',
        },
        rose: {
          DEFAULT: '#994d58',
          light: '#b5616d',
          dark: '#73333d',
        },
        wood: {
          950: '#0a0807',
          900: '#120f0d',
          850: '#1b1714',
          800: '#26201b',
          700: '#382f28',
          600: '#4d4036',
          500: '#69574a',
          400: '#8c7664',
          300: '#b39c87',
        },
        parchment: {
          25:  '#fffdf9',
          50:  '#FAF8F5',
          100: '#F5F2EB',
          150: '#ede6d4',
          200: '#EBE5D8',
          250: '#e3d7be',
          300: '#DFD6C2',
          400: '#D1C4A8',
          500: '#bda680',
          800: '#3D372E',
          900: '#231F19',
        },
        amberGlow: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4a373',
          600: '#b37d4e',
          700: '#8c5929',
        },
        wax: {
          crimson: '#801313',
          crimsonBright: '#a51c1c',
          crimsonDark: '#540808',
          gold: '#d4a373',
          emerald: '#1b4d3e',
          midnight: '#1a2744',
        },
        ink: {
          50: '#64748B',
          100: '#475569',
          500: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        cinzelDec: ['"Cinzel Decorative"', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
        script: ['"Alex Brush"', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'candle': '0 0 35px -5px rgba(212, 163, 115, 0.28)',
        'candle-lg': '0 0 55px -4px rgba(212, 163, 115, 0.42)',
        'wax-seal': '0 4px 10px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -2px 3px rgba(0, 0, 0, 0.4)',
        'parchment': '0 15px 35px -8px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(212, 163, 115, 0.2)',
        'book': '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.1)',
        'shelf-shadow': '0 12px 24px -4px rgba(0, 0, 0, 0.9), inset 0 2px 4px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [
    typography,
  ],
}
