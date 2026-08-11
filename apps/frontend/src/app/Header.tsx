import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Header({ title, showBack = false }: { title: string; showBack?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-tg-bg/95 backdrop-blur border-b border-line px-4 py-3.5 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full bg-accentSoft text-accent active:opacity-60"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
      )}
      <h1 className="font-bold text-tg-text text-[16px] tracking-tight2">{title}</h1>
    </header>
  );
}
