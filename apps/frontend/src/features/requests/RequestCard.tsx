import { RequestItem } from "@/shared/api/requests";
import { Thumb } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge, priorityBarClass } from "@/shared/ui/Badges";
import { useCategoryLabels } from "@/shared/hooks/useCategories";
import { Dictionary, localeOf, useI18n } from "@/shared/i18n";
import { thumbUrl } from "@/shared/lib/media";
import { Language, Priority } from "@app/shared-types";
import { Link } from "react-router-dom";
import { Wrench, AlertTriangle, CalendarPlus, CalendarCheck2 } from "lucide-react";

/** "3 soat oldin" / "3 ч. назад" ko'rinishidagi nisbiy vaqt. */
function relativeTime(iso: string, t: Dictionary, lang: Language): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return minutes <= 1 ? t.time.justNow : t.time.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.time.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return t.time.yesterday;
  if (days < 30) return t.time.daysAgo(days);
  return new Date(iso).toLocaleDateString(localeOf(lang), { day: "numeric", month: "short" });
}

/** Texnik/avtor F.I.Sh dan bosh harflar — kichik doiracha ("avatar") uchun. */
function initialsOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Rasm bo'lmaganda ko'rsatiladigan ikonka qutisi rangi — ustuvorlikka mos. */
const PRIORITY_TINT_CLASS: Record<Priority, string> = {
  [Priority.LOW]: "bg-priority-low/10 text-priority-low",
  [Priority.MEDIUM]: "bg-accentSoft text-accent",
  [Priority.HIGH]: "bg-priority-high/10 text-priority-high",
  [Priority.CRITICAL]: "bg-priority-critical/10 text-priority-critical",
};

export function RequestCard({ request }: { request: RequestItem }) {
  const { labelFor } = useCategoryLabels();
  const { t, lang, formatDateTime } = useI18n();
  // Bosh texnik "bajarish imkonsiz" izohini yozganini ro'yxatda ham ko'rsatamiz.
  const hasBlocker = (request.comments ?? []).some((c) => c.isBlocker);
  return (
    <Link to={`/requests/${request.id}`}>
      <div
        className={`relative overflow-hidden bg-tg-bg rounded-card shadow-card border border-line pl-4 pr-3.5 py-3.5 active:opacity-70 transition
          before:content-[''] before:absolute before:left-0 before:top-3.5 before:bottom-3.5 before:w-[3px] before:rounded-full ${priorityBarClass(
            request.priority,
          )}`}
      >
        <div className="flex items-start gap-3">
          {request.beforePhotoUrl ? (
            <Thumb
              // Ro'yxatda kichik nusxa yuklanadi (~20 KB), to'liq rasm emas.
              src={thumbUrl(request.beforePhotoUrl)}
              fallbackSrc={request.beforePhotoUrl}
              loading="lazy"
              className="w-11 h-11 rounded-[13px] object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0 ${PRIORITY_TINT_CLASS[request.priority]}`}
            >
              <Wrench size={18} strokeWidth={1.8} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-extrabold text-inkFaint uppercase tracking-wide truncate">
              {request.branch.name} · {labelFor(request.category)}
            </p>
            <p className="text-[14.5px] font-semibold text-tg-text mt-0.5 leading-snug line-clamp-2">
              {request.description}
            </p>
          </div>
          {!request.technician && (
            <span className="font-num text-[10px] font-bold text-inkFaint flex-shrink-0 mt-0.5">
              {relativeTime(request.createdAt, t, lang)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-line">
          <StatusBadge status={request.status} />
          {hasBlocker && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-priority-critical/10 text-priority-critical text-[10.5px] font-bold">
              <AlertTriangle size={10} strokeWidth={2.5} />
              {t.request.hasComment}
            </span>
          )}
          {request.technician && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-inkSoft ml-auto">
              <span className="w-[18px] h-[18px] rounded-full bg-accentSoft text-accent flex items-center justify-center text-[8.5px] font-extrabold flex-shrink-0">
                {initialsOf(request.technician.fullName)}
              </span>
              {request.technician.fullName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-2">
          <PriorityBadge priority={request.priority} />
          <span className="font-num inline-flex items-center gap-1 text-[10px] font-semibold text-inkFaint">
            <CalendarPlus size={11} strokeWidth={2} />
            {t.detail.openedAt}: {formatDateTime(request.createdAt)}
          </span>
          {request.closedAt && (
            <span className="font-num inline-flex items-center gap-1 text-[10px] font-semibold text-inkFaint">
              <CalendarCheck2 size={11} strokeWidth={2} />
              {t.detail.closedAt}: {formatDateTime(request.closedAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
