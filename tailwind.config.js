/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#EBE5D8',
          300: '#DFD6C2',
          400: '#D1C4A8',
          800: '#3D372E',
          900: '#231F19',
        },
        ink: {
          50: '#64748B',
          100: '#475569',
          500: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E3EBE3',
          600: '#52796F',
          700: '#354F52',
        },
        rosewood: {
          50: '#FDF6F6',
          100: '#F8E8E8',
          500: '#C06C84',
          700: '#6C5B7B',
        }
      },
      fontFamily: {
        serif: ['Lora', 'Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
