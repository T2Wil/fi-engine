/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "in": "in 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-from-bottom-2": "slide-in-from-bottom-2 0.2s ease-out",
      },
      keyframes: {
        in: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-in-from-bottom-2": { "0%": { transform: "translateY(0.5rem)" }, "100%": { transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
