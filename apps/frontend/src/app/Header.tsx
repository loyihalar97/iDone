import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Header({ title, showBack = false }: { title: string; showBack?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-tg-bg/90 backdrop-blur-md border-b border-line px-4 py-4 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 -ml-1 flex-shrink-0 flex items-center justify-center rounded-full bg-accentSoft text-accent active:opacity-60 transition"
        >
          <ArrowLeft size={17} strokeWidth={2.25} />
        </button>
      )}
      <h1 className="font-extrabold text-tg-text text-[19px] tracking-tight2">{title}</h1>
    </header>
  );
}
