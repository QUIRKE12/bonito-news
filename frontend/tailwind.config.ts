import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#16213E",
        papyrus: "#EFE8D8",
        amber: "#E8873A",
        "amber-deep": "#C96A22",
        teal: "#1F7A6C",
        charcoal: "#2A2A28",
        line: "#DFD8C8",
        muted: "#7A7566",
        brand: "#1F7A6C",
        "brand-dark": "#175f54",
        "brand-soft": "#E4F1EE",
        // Gigo Business Company brand palette — used for the /admin dashboard only
        adminNavy: "#0D1B2A",
        adminNavyLight: "#162333",
        adminOrange: "#F5A623",
        "adminOrange-dark": "#D9900F",
        "adminOrange-soft": "#FFF3E0",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
