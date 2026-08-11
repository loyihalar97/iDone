import { Priority, RequestStatus, PRIORITY_LABELS_UZ, STATUS_LABELS_UZ } from "@app/shared-types";

const PRIORITY_DOT: Record<Priority, string> = {
  [Priority.LOW]: "bg-priority-low",
  [Priority.MEDIUM]: "bg-priority-medium",
  [Priority.HIGH]: "bg-priority-high",
  [Priority.CRITICAL]: "bg-priority-critical",
};

const STATUS_DOT: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "bg-status-new",
  [RequestStatus.IN_PROGRESS]: "bg-status-progress",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "bg-status-techDone",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "bg-status-chiefApproved",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "bg-status-directorAccepted",
  [RequestStatus.CLOSED]: "bg-status-closed",
};

function Dot({ className }: { className: string }) {
  return <span className={`w-1.5 h-1.5 rounded-full ${className}`} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-line text-xs font-medium text-tg-text">
      <Dot className={PRIORITY_DOT[priority]} />
      {PRIORITY_LABELS_UZ[priority]}
    </span>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-line text-xs font-medium text-tg-text">
      <Dot className={STATUS_DOT[status]} />
      {STATUS_LABELS_UZ[status]}
    </span>
  );
}
