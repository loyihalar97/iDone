import { useNavigate } from "react-router-dom";

export function Header({ title, showBack = false }: { title: string; showBack?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-tg-bg border-b border-black/5 px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button onClick={() => navigate(-1)} className="text-tg-link text-xl leading-none">
          ←
        </button>
      )}
      <h1 className="font-semibold text-tg-text text-base">{title}</h1>
    </header>
  );
}
