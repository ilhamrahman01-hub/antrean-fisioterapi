/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00685f",
          light: "#0d9488",
          dark: "#005049",
          container: "#008378",
          fixed: "#89f5e7",
        },
        secondary: {
          DEFAULT: "#006a63",
          container: "#99efe5",
          fixed: "#9cf2e8",
        },
        surface: {
          DEFAULT: "#faf8ff",
          container: "#eaedff",
          high: "#e2e7ff",
          highest: "#dae2fd",
          low: "#f2f3ff",
          lowest: "#ffffff",
        },
        puskesmas: {
          green: "#00685f",
          mint: "#f0fdf4",
          borderMint: "#99f6e4",
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
};
