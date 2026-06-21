import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        apple: {
          blue: "#007AFF",
          gray: {
            50: "#F5F5F7",
            100: "#E8E8ED",
            200: "#D2D2D7",
            300: "#AEAEB2",
            400: "#86868B",
            500: "#6E6E73",
            600: "#48484A",
            900: "#1D1D1F",
          },
        },
      },
      boxShadow: {
        apple: "0 2px 16px rgba(0, 0, 0, 0.08)",
        "apple-lg": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
