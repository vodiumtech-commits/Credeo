import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vodium brand tokens
        vodium: {
          black: "#0A0A0A",
          gold: "#C9A961",
          "gold-soft": "#E5C97D",
          cream: "#FAFAF7",
          charcoal: "#1F1F1F",
          slate: "#2A2A2A",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        // shadcn-friendly tokens (mapped to Vodium)
        background: "#FAFAF7",
        foreground: "#0A0A0A",
        primary: {
          DEFAULT: "#0A0A0A",
          foreground: "#FAFAF7",
        },
        accent: {
          DEFAULT: "#C9A961",
          foreground: "#0A0A0A",
        },
        muted: {
          DEFAULT: "#F0EFEA",
          foreground: "#5A5A5A",
        },
        border: "#E5E2D9",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
