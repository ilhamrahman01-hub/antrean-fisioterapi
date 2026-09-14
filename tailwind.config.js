/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          dark: '#0f2922',     // Very dark, almost black forest green
          primary: '#114a3b',  // Deep emerald
          light: '#e8f3ef',    // Off-white with a hint of green
        },
        surface: {
          light: '#fafafa',
          muted: '#f4f4f5',
        }
      }
    },
  },
  plugins: [],
};
