import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0E0E0E",
        surface: "#1A1A1A",
        border: "#2A2A2A",
        muted: "#3A3A3A",
        "text-primary": "#F0F0F0",
        "text-secondary": "#8A8A8A",
        "text-tertiary": "#5A5A5A",
        trait: {
          O: "#7F77DD", // Openness — indigo
          C: "#4CAF82", // Conscientiousness — green
          E: "#E9A84C", // Extraversion — amber
          A: "#4CBFBF", // Agreeableness — teal
          N: "#D4537E", // Neuroticism — rose
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
