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
    <div className={`bg-tg-bg border border-line rounded-card shadow-card p-4 ${className}`}>
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
    "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-control font-semibold text-sm transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    primary: "bg-tg-button text-tg-buttonText shadow-accent",
    secondary: "bg-accentSoft text-accent border border-transparent",
    ghost: "bg-transparent text-tg-hint",
    danger: "bg-transparent text-red-600 border border-red-200",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-xs font-medium text-tg-hint uppercase tracking-wide mb-2 ${className}`}
      {...props}
    />
  );
}

const fieldBase =
  "w-full bg-transparent border border-line rounded-control px-3 py-2.5 text-sm text-tg-text placeholder:text-tg-hint focus:outline-none focus:border-accent transition";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} resize-none ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} appearance-none ${className}`} {...props} />;
}

export function Thumb({ className = "", alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  if (failed || !props.src) {
    return (
      <div
        className={`flex items-center justify-center bg-tg-secondaryBg border border-line text-tg-hint ${className}`}
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
      <Loader2 size={22} className="animate-spin" strokeWidth={1.75} />
      {label && <span className="text-sm">{label}</span>}
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
        <div className="w-11 h-11 rounded-full border border-line flex items-center justify-center mb-3 text-tg-hint">
          <Icon size={20} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-tg-text font-medium text-sm">{title}</p>
      {subtitle && <p className="text-tg-hint text-xs mt-1 max-w-[240px]">{subtitle}</p>}
    </div>
  );
}
