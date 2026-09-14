/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Telegram WebApp CSS o'zgaruvchilariga bog'langan — foydalanuvchining
        // Telegram mavzusiga (light/dark) avtomatik moslashadi. Fallback qiymatlar
        // yangi dizayn tizimining aksent rangiga (#2F5AF5, indigo ko'k) moslangan —
        // bitta aksent rang va neytral kulrang shkala, minimalizm uchun.
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          secondaryBg: "var(--tg-theme-secondary-bg-color, #F4F5F7)",
          text: "var(--tg-theme-text-color, #12141C)",
          hint: "var(--tg-theme-hint-color, #767C88)",
          link: "var(--tg-theme-link-color, #2F5AF5)",
          button: "var(--tg-theme-button-color, #2F5AF5)",
          buttonText: "var(--tg-theme-button-text-color, #ffffff)",
        },
        line: "#E7E8EC",
        lineStrong: "#D7D9E0",
        ink: "#12141C",
        inkSoft: "#666C7A",
        inkFaint: "#9AA0AC",
        accent: "#2F5AF5",
        accentSoft: "#EBEFFF",
        accentDark: "#1C3BC7",
        priority: {
          low: "#767C88",
          medium: "#2F5AF5",
          high: "#C77700",
          critical: "#D42B2B",
        },
        status: {
          new: "#2F5AF5",
          progress: "#C77700",
          techDone: "#7C5CFF",
          chiefApproved: "#0E9F87",
          directorAccepted: "#16915A",
          closed: "#767C88",
        },
      },
      fontFamily: {
        sans: ["Manrope", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "18px",
        control: "12px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(18 20 28 / 0.04), 0 1px 1px 0 rgb(18 20 28 / 0.03)",
        accent: "0 8px 20px -8px rgb(47 90 245 / 0.45)",
        float: "0 8px 24px 0 rgb(18 20 28 / 0.10)",
      },
      letterSpacing: {
        tight2: "-0.01em",
      },
    },
  },
  plugins: [],
};
