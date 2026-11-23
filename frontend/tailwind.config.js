/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#002B5B',
          navyDark: '#001F42',
          blue: '#0052CC',
          blueDark: '#003D99',
          sky: '#60A5FA',
          ice: '#EBF2FF',
        },
        emerald: {
          50: '#EBF2FF',
          100: '#D6E4FF',
          200: '#ADC8FF',
          300: '#84A9FF',
          400: '#3B82F6',
          500: '#0052CC',
          600: '#003D99',
          700: '#002B5B',
          800: '#001F42',
          900: '#00142B',
        },
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 43, 91, 0.045)',
        'card-hover': '0 10px 32px rgba(0, 43, 91, 0.09)',
        float: '0 14px 40px rgba(0, 43, 91, 0.12)',
        brand: '0 8px 22px rgba(0, 82, 204, 0.28)',
      },
    },
  },
  plugins: [],
}
