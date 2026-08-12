import { ReactNode, useRef, useState } from "react";
import { LucideIcon } from "lucide-react";

export interface SwipeAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  /** Tailwind klasslar: fon + matn rangi, masalan "bg-priority-critical text-white" */
  className: string;
  onClick: () => void;
}

const ACTION_WIDTH = 76; // har bir amal tugmasi kengligi (px)

/**
 * Chapga surib (swipe-left) yashirin amallarni ochadigan qator.
 * Telegram Mini App (touch) va desktop (sichqoncha) uchun ishlaydi.
 * Vertikal scroll'ga xalaqit bermaydi — faqat gorizontal harakat ushlanadi.
 */
export function SwipeRow({
  actions,
  children,
  className = "",
}: {
  actions: SwipeAction[];
  children: ReactNode;
  className?: string;
}) {
  const revealWidth = actions.length * ACTION_WIDTH;
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(true);

  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axis = useRef<"none" | "h" | "v">("none");
  const active = useRef(false);
  const moved = useRef(false);

  function begin(x: number, y: number) {
    startX.current = x;
    startY.current = y;
    startOffset.current = offset;
    axis.current = "none";
    active.current = true;
    moved.current = false;
    setAnimate(false);
  }

  function move(x: number, y: number) {
    if (!active.current) return;
    const dx = x - startX.current;
    const dy = y - startY.current;

    if (axis.current === "none") {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (axis.current !== "h") return; // vertikal — scroll'ga qo'yib beramiz

    moved.current = true;
    let next = startOffset.current + dx;
    if (next > 0) next = 0;
    if (next < -revealWidth) next = -revealWidth;
    setOffset(next);
  }

  function end() {
    if (!active.current) return;
    active.current = false;
    setAnimate(true);
    setOffset(offset < -revealWidth / 2 ? -revealWidth : 0);
  }

  function close() {
    setAnimate(true);
    setOffset(0);
  }

  return (
    <div className={`relative overflow-hidden rounded-card ${className}`}>
      {/* Yashirin amallar (orqa fon) */}
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              style={{ width: ACTION_WIDTH }}
              onClick={() => {
                a.onClick();
                close();
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${a.className}`}
            >
              {Icon && <Icon size={17} strokeWidth={2.25} />}
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Ustki qatlam (kontent) */}
      <div
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
        className={animate ? "transition-transform duration-200 ease-out" : ""}
        onTouchStart={(e) => begin(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={end}
        onMouseDown={(e) => begin(e.clientX, e.clientY)}
        onMouseMove={(e) => {
          if (active.current) move(e.clientX, e.clientY);
        }}
        onMouseUp={end}
        onMouseLeave={end}
        // Surish tugagach bosishni (masalan Link navigatsiyasini) bloklaymiz
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
