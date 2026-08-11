import { CATEGORY_LABELS_UZ } from "@app/shared-types";
import { RequestItem } from "@/shared/api/requests";
import { Card, Thumb } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge } from "@/shared/ui/Badges";
import { Link } from "react-router-dom";
import { User } from "lucide-react";

export function RequestCard({ request }: { request: RequestItem }) {
  return (
    <Link to={`/requests/${request.id}`}>
      <Card className="active:opacity-70 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-tg-text text-[15px] truncate">{request.branch.name}</p>
            <p className="text-xs text-tg-hint mt-0.5">{CATEGORY_LABELS_UZ[request.category]}</p>
          </div>
          {request.beforePhotoUrl && (
            <Thumb
              src={request.beforePhotoUrl}
              className="w-12 h-12 rounded-control object-cover flex-shrink-0"
            />
          )}
        </div>
        <p className="text-sm text-tg-text/80 line-clamp-2 mt-2 mb-2.5 leading-relaxed">
          {request.description}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          {request.technician && (
            <span className="inline-flex items-center gap-1 text-xs text-tg-hint ml-auto">
              <User size={12} strokeWidth={1.75} />
              {request.technician.fullName}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

