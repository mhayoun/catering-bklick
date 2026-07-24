/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F7FAF8',
        orange: '#E8622C',
        orangeDark: '#B94E20',
        teal: '#0E4F52',
        tealLight: '#137075',
        tealGreen: '#25786B',
        lime: '#C7D92C',
        limeLight: '#EAF2C9',
        ink: '#1B2A2B'
      },
      fontFamily: {
        display: ['var(--font-rubik)', 'sans-serif'],
        body: ['var(--font-heebo)', 'sans-serif']
      },
      borderRadius: {
        blob: '2rem 1rem 2rem 1rem'
      },
      boxShadow: {
        card: '0 4px 14px 0 rgba(14,79,82,0.12)',
        cardHover: '0 12px 28px 0 rgba(14,79,82,0.18)'
      }
    }
  },
  plugins: []
};
