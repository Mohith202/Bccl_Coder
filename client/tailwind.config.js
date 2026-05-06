/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Source Serif Pro", "ui-serif", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#eef2f6",
          200: "#dde4ec",
          400: "#7b8a9b",
          600: "#37475a",
          800: "#1b2533",
          900: "#0e1623",
        },
        accent: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)",
        rail: "inset -1px 0 0 rgba(15,23,42,0.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
