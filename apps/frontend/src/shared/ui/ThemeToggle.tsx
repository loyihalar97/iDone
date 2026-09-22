import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/hooks/useTheme";

/**
 * Yorug'/Qorong'i mavzu tugmasi — sarlavhada til almashtirgichi yonida
 * turadi. Tanlov `localStorage`da saqlanadi (shared/hooks/useTheme.tsx).
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Yorug' mavzuga o'tish" : "Qorong'i mavzuga o'tish"}
      title={isDark ? "Yorug' mavzu" : "Qorong'i mavzu"}
      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-tg-secondaryBg border border-line text-accent active:opacity-60 transition"
    >
      {isDark ? <Moon size={15} strokeWidth={2.2} /> : <Sun size={15} strokeWidth={2.2} />}
    </button>
  );
}
