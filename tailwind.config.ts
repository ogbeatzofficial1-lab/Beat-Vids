import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      colors: {
        brand: {
          50:  "#f3f0ff",
          100: "#e9e3ff",
          200: "#d4caff",
          300: "#b3a4ff",
          400: "#8b74ff",
          500: "#6d4aff",
          600: "#5b2fff",
          700: "#4a1edb",
          800: "#3d19b3",
          900: "#331892",
          950: "#1e0d63",
        },
      },

      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "slide-up":     "slideUp 0.25s ease-out",
        "slide-down":   "slideDown 0.25s ease-out",
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":    "spin 3s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)"  },
          "100%": { opacity: "1", transform: "translateY(0)"     },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)"     },
        },
      },

      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noise":             "url('/noise.png')",
      },

      boxShadow: {
        "glow-violet": "0 0 20px rgba(139, 92, 246, 0.35)",
        "glow-fuchsia":"0 0 20px rgba(232, 121, 249, 0.35)",
        "inner-dark":  "inset 0 2px 8px rgba(0,0,0,0.5)",
      },

      typography: {
        DEFAULT: {
          css: {
            color:            "#a1a1aa",
            "h1,h2,h3,h4":   { color: "#ffffff" },
            strong:           { color: "#ffffff" },
            a:                { color: "#a78bfa" },
            code:             { color: "#c084fc" },
          },
        },
      },
    },
  },

  plugins: [],
};

export default config;
