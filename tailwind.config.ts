import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // CSS variables are set by next/font in app/layout.tsx — see Inter and
        // Cormorant_Garamond imports there. Fallbacks remain so styles still
        // resolve sensibly if the variable isn't applied.
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#FAFAF8",
        stone: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.8s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
