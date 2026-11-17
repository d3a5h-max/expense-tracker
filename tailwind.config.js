/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#070D1E",
          800: "#0A1430",
          700: "#0E1A38",
          600: "#12224A",
          500: "#1E3563",
          400: "#2A4578",
          300: "#3A5A96",
        },
        ice: {
          500: "#1E3563",
          600: "#2A4578",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Consolas", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};