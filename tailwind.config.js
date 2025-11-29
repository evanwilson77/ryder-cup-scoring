/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b4c7fb',
          400: '#8aa5f8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4451b8',
          800: '#373f94',
          900: '#2f3575',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#764ba2',
          600: '#6b408f',
          700: '#5e367c',
          800: '#4f2d67',
          900: '#3f2453',
        },
        'ryder-red': {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        'ryder-blue': {
          DEFAULT: '#2563EB',
          light: '#DBEAFE',
          dark: '#1E40AF',
        },
        'honours-gold': '#d4af37',
        'honours-brass': '#b5a642',
        'honours-wood': '#2c1810',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
