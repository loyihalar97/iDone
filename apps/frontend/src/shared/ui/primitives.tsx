import { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`bg-tg-secondaryBg rounded-card p-4 ${className}`}>
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "px-4 py-2.5 rounded-xl font-medium text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const styles = {
    primary: "bg-tg-button text-tg-buttonText",
    secondary: "bg-tg-secondaryBg text-tg-text border border-black/10",
    danger: "bg-red-600 text-white",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-tg-hint gap-2">
      <div className="w-6 h-6 border-2 border-tg-hint border-t-transparent rounded-full animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <p className="text-tg-text font-medium">{title}</p>
      {subtitle && <p className="text-tg-hint text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
