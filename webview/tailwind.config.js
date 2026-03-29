/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gfs: {
          bg: "#000000",
          surface: "#0A0A0A",
          surface1: "#111111",
          surface2: "#1A1A1A",
          primary: "#1A1A1A",
          accent: "#FF6B00",
          accent2: "#FF8C33",
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          text: "#FFFFFF",
          text2: "#E5E5E5",
          muted: "#737373",
          muted2: "#525252",
        },
        ignite: "#FF6B00",
        chalk: "#FFFFFF",
        blush: "#737373",
        obsidian: "#000000",
        border: "#262626",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      borderRadius: {
        gfs: "12px",
      },
      boxShadow: {
        node: "0 4px 24px rgba(15, 23, 42, 0.45)",
      },
    },
  },
  plugins: [],
};
