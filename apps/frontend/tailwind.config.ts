/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Telegram WebApp CSS o'zgaruvchilariga bog'langan — foydalanuvchining
        // Telegram mavzusiga (light/dark) avtomatik moslashadi.
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          secondaryBg: "var(--tg-theme-secondary-bg-color, #f5f6f8)",
          text: "var(--tg-theme-text-color, #111827)",
          hint: "var(--tg-theme-hint-color, #6b7280)",
          link: "var(--tg-theme-link-color, #2563eb)",
          button: "var(--tg-theme-button-color, #2563eb)",
          buttonText: "var(--tg-theme-button-text-color, #ffffff)",
        },
        priority: {
          low: "#6b7280",
          medium: "#2563eb",
          high: "#d97706",
          critical: "#dc2626",
        },
        status: {
          new: "#2563eb",
          progress: "#d97706",
          techDone: "#7c3aed",
          chiefApproved: "#0891b2",
          directorAccepted: "#16a34a",
          closed: "#4b5563",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
