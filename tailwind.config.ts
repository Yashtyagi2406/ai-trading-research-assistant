import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        edge: "#1e293b",
        accent: "#3b82f6",
        good: "#16a34a",
        warn: "#d97706",
      },
    },
  },
  plugins: [],
};

export default config;
