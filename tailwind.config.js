/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ttb-blue': '#003f88',
        'ttb-gold': '#ffc429',
        'success-green': '#10b981',
        'error-red': '#ef4444',
      },
    },
  },
  plugins: [],
}
