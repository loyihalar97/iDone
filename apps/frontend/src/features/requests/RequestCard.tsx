import { CATEGORY_LABELS_UZ } from "@app/shared-types";
import { RequestItem } from "@/shared/api/requests";
import { Thumb } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge, priorityBarClass } from "@/shared/ui/Badges";
import { Link } from "react-router-dom";
import { User, ImageIcon } from "lucide-react";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return minutes <= 1 ? "hozir" : `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "kecha";
  if (days < 30) return `${days} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

export function RequestCard({ request }: { request: RequestItem }) {
  return (
    <Link to={`/requests/${request.id}`}>
      <div
        className={`relative overflow-hidden bg-tg-bg rounded-card shadow-card border border-line/60 pl-4 pr-3.5 py-3.5 active:opacity-70 transition
          before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3.5px] ${priorityBarClass(
            request.priority,
          )}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-inkFaint uppercase tracking-wide truncate">
              {request.branch.name} · {CATEGORY_LABELS_UZ[request.category]}
            </p>
            <p className="text-[14.5px] font-medium text-tg-text mt-1 leading-snug line-clamp-2">
              {request.description}
            </p>
          </div>
          {request.beforePhotoUrl ? (
            <Thumb
              src={request.beforePhotoUrl}
              className="w-10 h-10 rounded-[10px] object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-[10px] bg-tg-secondaryBg flex items-center justify-center flex-shrink-0 text-inkFaint">
              <ImageIcon size={16} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          {request.technician ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-inkFaint ml-auto">
              <User size={11} strokeWidth={2} />
              {request.technician.fullName}
            </span>
          ) : (
            <span className="font-num text-[10.5px] text-inkFaint ml-auto">{relativeTime(request.createdAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
