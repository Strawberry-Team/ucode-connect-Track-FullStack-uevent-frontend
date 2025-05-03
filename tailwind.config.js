/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#3aa9f7',
          500: '#1a91e6',
          600: '#0d71c4',
          700: '#0d5aa0',
          800: '#104c84',
          900: '#12406e',
        },
        
        dark: {
          bg: '#121212',
          card: '#1E1E1E',
          border: '#333333',
          text: {
            primary: '#ffffff',
            secondary: '#a0aec0',
          },
        },
      },
      backgroundColor: {
        
        'theme-bg': 'var(--bg-primary)',
        'theme-card': 'var(--bg-card)',
        'theme-input': 'var(--bg-input)',
        'theme-accent': 'var(--accent)',
      },
      textColor: {
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-accent': 'var(--accent)',
      },
      borderColor: {
        'theme-border': 'var(--border)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
  ],
};