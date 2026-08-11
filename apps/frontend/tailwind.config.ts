/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Telegram WebApp CSS o'zgaruvchilariga bog'langan — foydalanuvchining
        // Telegram mavzusiga (light/dark) avtomatik moslashadi. Fallback qiymatlar
        // brend aksent rangiga (#FF5800, to'q apelsin) moslangan — bitta aksent rang
        // va neytral kulrang shkala.
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          secondaryBg: "var(--tg-theme-secondary-bg-color, #f7f7f9)",
          text: "var(--tg-theme-text-color, #18181b)",
          hint: "var(--tg-theme-hint-color, #8b8b93)",
          link: "var(--tg-theme-link-color, #FF5800)",
          button: "var(--tg-theme-button-color, #FF5800)",
          buttonText: "var(--tg-theme-button-text-color, #ffffff)",
        },
        line: "#e4e4e7",
        lineStrong: "#d4d4d8",
        accent: "#FF5800",
        accentSoft: "#FFF0E6",
        accentDark: "#E64F00",
        priority: {
          low: "#71717a",
          medium: "#2563eb",
          high: "#d97706",
          critical: "#dc2626",
        },
        status: {
          new: "#FF5800",
          progress: "#d97706",
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
        card: "20px",
        control: "14px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 2px 10px 0 rgb(24 24 27 / 0.05)",
        accent: "0 8px 18px -6px rgb(255 88 0 / 0.45)",
      },
      letterSpacing: {
        tight2: "-0.01em",
      },
    },
  },
  plugins: [],
};
