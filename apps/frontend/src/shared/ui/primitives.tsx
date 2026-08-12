import {
  ButtonHTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  PropsWithChildren,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useState,
} from "react";
import { LucideIcon, Loader2, ImageOff } from "lucide-react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`bg-tg-bg rounded-card shadow-card border border-line/60 p-4 ${className}`}>
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: LucideIcon;
}

export function Button({
  variant = "primary",
  icon: Icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-control font-bold text-sm transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    primary: "bg-tg-button text-tg-buttonText shadow-accent",
    secondary: "bg-accentSoft text-accentDark border border-transparent",
    ghost: "bg-transparent text-tg-hint",
    danger: "bg-transparent text-priority-critical border border-priority-critical/25",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-[11px] font-extrabold text-inkFaint uppercase tracking-wide mb-2 ${className}`}
      {...props}
    />
  );
}

const fieldBase =
  "w-full bg-tg-bg border border-lineStrong rounded-control px-3.5 py-2.5 text-sm text-tg-text placeholder:text-inkFaint focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accentSoft transition";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} resize-none leading-relaxed ${className}`} {...props} />;
}

const chevronBg =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23666C7A' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${fieldBase} appearance-none bg-no-repeat pr-8 ${className}`}
      style={{ backgroundImage: `url("${chevronBg}")`, backgroundPosition: "right 14px center" }}
      {...props}
    />
  );
}

export function Thumb({ className = "", alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  if (failed || !props.src) {
    return (
      <div
        className={`flex items-center justify-center bg-tg-secondaryBg border border-line text-inkFaint ${className}`}
      >
        <ImageOff size={18} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={`border border-line bg-tg-secondaryBg ${className}`}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-tg-hint gap-2">
      <Loader2 size={22} className="animate-spin text-accent" strokeWidth={2} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-accentSoft flex items-center justify-center mb-4 text-accent">
          <Icon size={24} strokeWidth={1.75} />
        </div>
      )}
      <p className="text-tg-text font-extrabold text-[15px]">{title}</p>
      {subtitle && <p className="text-tg-hint text-[13px] mt-1.5 max-w-[240px] leading-relaxed">{subtitle}</p>}
    </div>
  );
}

/** Status/faollik ko'rsatkichi uchun kichik pill — foydalanuvchi va filial kartalarida ishlatiladi. */
export function StatusPill({
  active,
  activeLabel = "Faol",
  inactiveLabel = "Faol emas",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-bold ${
        active ? "bg-status-directorAccepted/10 text-status-directorAccepted" : "bg-inkFaint/10 text-inkFaint"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-status-directorAccepted" : "bg-inkFaint"}`} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
