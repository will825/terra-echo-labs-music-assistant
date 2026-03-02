/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      colors: {
        teal: {
          400: '#2dd4bf',
          600: '#0d9488'
        }
      }
    }
  },
  plugins: []
}
