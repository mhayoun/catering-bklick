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
        cream: '#FFF8EC',
        paprika: '#C1440E',
        paprikaDark: '#9A350A',
        eggplant: '#3E2145',
        eggplantLight: '#5A3363',
        zaatar: '#6E7A4F',
        turmeric: '#E4A93A',
        turmericLight: '#F3D08A',
        ink: '#241A21'
      },
      fontFamily: {
        display: ['var(--font-rubik)', 'sans-serif'],
        body: ['var(--font-heebo)', 'sans-serif']
      },
      borderRadius: {
        blob: '2rem 1rem 2rem 1rem'
      },
      boxShadow: {
        card: '0 6px 0 0 rgba(62,33,69,0.12)',
        cardHover: '0 10px 0 0 rgba(62,33,69,0.16)'
      }
    }
  },
  plugins: []
};
