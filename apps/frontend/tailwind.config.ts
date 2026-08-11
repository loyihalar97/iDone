/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Telegram WebApp CSS o'zgaruvchilariga bog'langan — foydalanuvchining
        // Telegram mavzusiga (light/dark) avtomatik moslashadi. Fallback qiymatlar
        // minimalist, deyarli monoxrom palitraga moslangan — bitta aksent rang (indigo)
        // va neytral kulrang shkala.
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          secondaryBg: "var(--tg-theme-secondary-bg-color, #fafafa)",
          text: "var(--tg-theme-text-color, #18181b)",
          hint: "var(--tg-theme-hint-color, #8b8b93)",
          link: "var(--tg-theme-link-color, #4f46e5)",
          button: "var(--tg-theme-button-color, #18181b)",
          buttonText: "var(--tg-theme-button-text-color, #ffffff)",
        },
        line: "#e4e4e7",
        lineStrong: "#d4d4d8",
        accent: "#4f46e5",
        accentSoft: "#eef2ff",
        priority: {
          low: "#71717a",
          medium: "#4f46e5",
          high: "#c2760c",
          critical: "#dc2626",
        },
        status: {
          new: "#4f46e5",
          progress: "#c2760c",
          techDone: "#7c3aed",
          chiefApproved: "#0891b2",
          directorAccepted: "#16a34a",
          closed: "#71717a",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        control: "12px",
      },
      letterSpacing: {
        tight2: "-0.01em",
      },
    },
  },
  plugins: [],
};
