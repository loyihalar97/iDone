/** @type {import('tailwindcss').Config} */
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${varName}))` : `rgb(var(${varName}) / ${opacityValue})`;
}

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Barchasi CSS o'zgaruvchilariga (RGB triplet) bog'langan — shu orqali
        // light/dark mavzular va Tailwind'ning opacity modifikatorlari (/10, /40...)
        // bir vaqtda ishlaydi. Qiymatlar src/index.css'da :root va
        // [data-theme="dark"] ostida e'lon qilingan.
        tg: {
          bg: withOpacity("--color-surface"),
          secondaryBg: withOpacity("--color-page-bg"),
          text: withOpacity("--color-ink"),
          hint: withOpacity("--color-ink-soft"),
          link: withOpacity("--color-accent"),
          button: withOpacity("--color-accent"),
          buttonText: withOpacity("--color-on-accent"),
        },
        line: withOpacity("--color-line"),
        lineStrong: withOpacity("--color-line-strong"),
        ink: withOpacity("--color-ink"),
        inkSoft: withOpacity("--color-ink-soft"),
        inkFaint: withOpacity("--color-ink-faint"),
        accent: withOpacity("--color-accent"),
        accentSoft: withOpacity("--color-accent-soft"),
        accentDark: withOpacity("--color-accent-dark"),
        priority: {
          low: withOpacity("--color-priority-low"),
          medium: withOpacity("--color-priority-medium"),
          high: withOpacity("--color-priority-high"),
          critical: withOpacity("--color-priority-critical"),
        },
        status: {
          new: withOpacity("--color-status-new"),
          progress: withOpacity("--color-status-progress"),
          techDone: withOpacity("--color-status-tech-done"),
          chiefApproved: withOpacity("--color-status-chief-approved"),
          directorAccepted: withOpacity("--color-status-director-accepted"),
          closed: withOpacity("--color-status-closed"),
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
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 10px 24px -14px rgb(0 0 0 / 0.14)",
        accent: "0 8px 20px -8px rgb(var(--color-accent) / 0.45)",
        float: "0 8px 24px 0 rgb(0 0 0 / 0.12)",
      },
      letterSpacing: {
        tight2: "-0.01em",
      },
    },
  },
  plugins: [],
};
