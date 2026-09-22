import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { telegram } from "@/shared/telegram/webapp";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "idone-theme";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage yo'q bo'lishi mumkin — jim o'tamiz.
  }
  // Telegram klienti allaqachon o'z mavzusini bildiradi — birinchi
  // ochilishda shu bo'yicha moslashamiz, keyin foydalanuvchi tugma orqali
  // o'zi tanlasa, shu tanlov ustunlik qiladi (yuqoridagi localStorage).
  if (telegram.colorScheme === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // jim o'tamiz — tema shunchaki saqlanmaydi.
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme faqat ThemeProvider ichida ishlaydi");
  return ctx;
}
