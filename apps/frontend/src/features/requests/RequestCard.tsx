import { CATEGORY_LABELS_UZ } from "@app/shared-types";
import { RequestItem } from "@/shared/api/requests";
import { Card } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge } from "@/shared/ui/Badges";
import { Link } from "react-router-dom";

export function RequestCard({ request }: { request: RequestItem }) {
  return (
    <Link to={`/requests/${request.id}`}>
      <Card className="mb-3 active:opacity-80 transition">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-tg-text">{request.branch.name}</p>
            <p className="text-sm text-tg-hint">{CATEGORY_LABELS_UZ[request.category]}</p>
          </div>
          <img
            src={request.beforePhotoUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        </div>
        <p className="text-sm text-tg-text line-clamp-2 mb-3">{request.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          {request.technician && (
            <span className="text-xs text-tg-hint">👷 {request.technician.fullName}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
