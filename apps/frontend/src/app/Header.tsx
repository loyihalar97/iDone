import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Header({ title, showBack = false }: { title: string; showBack?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-tg-bg/95 backdrop-blur border-b border-line px-4 py-3.5 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-7 h-7 -ml-1 flex items-center justify-center text-tg-text active:opacity-60"
        >
          <ArrowLeft size={19} strokeWidth={1.75} />
        </button>
      )}
      <h1 className="font-semibold text-tg-text text-[15px] tracking-tight2">{title}</h1>
    </header>
  );
}
