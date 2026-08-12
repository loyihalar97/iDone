import { Priority, RequestStatus, PRIORITY_LABELS_UZ, STATUS_LABELS_UZ } from "@app/shared-types";

const PRIORITY_DOT: Record<Priority, string> = {
  [Priority.LOW]: "bg-priority-low",
  [Priority.MEDIUM]: "bg-priority-medium",
  [Priority.HIGH]: "bg-priority-high",
  [Priority.CRITICAL]: "bg-priority-critical",
};

const PRIORITY_TINT: Record<Priority, string> = {
  [Priority.LOW]: "bg-priority-low/10 text-priority-low",
  [Priority.MEDIUM]: "bg-priority-medium/10 text-priority-medium",
  [Priority.HIGH]: "bg-priority-high/10 text-priority-high",
  [Priority.CRITICAL]: "bg-priority-critical/10 text-priority-critical",
};

const STATUS_DOT: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "bg-status-new",
  [RequestStatus.IN_PROGRESS]: "bg-status-progress",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "bg-status-techDone",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "bg-status-chiefApproved",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "bg-status-directorAccepted",
  [RequestStatus.CLOSED]: "bg-status-closed",
};

const STATUS_TINT: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "bg-status-new/10 text-status-new",
  [RequestStatus.IN_PROGRESS]: "bg-status-progress/10 text-status-progress",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "bg-status-techDone/10 text-status-techDone",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "bg-status-chiefApproved/10 text-status-chiefApproved",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "bg-status-directorAccepted/10 text-status-directorAccepted",
  [RequestStatus.CLOSED]: "bg-status-closed/10 text-status-closed",
};

function Dot({ className }: { className: string }) {
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${className}`} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-bold ${PRIORITY_TINT[priority]}`}
    >
      <Dot className={PRIORITY_DOT[priority]} />
      {PRIORITY_LABELS_UZ[priority]}
    </span>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-bold ${STATUS_TINT[status]}`}
    >
      <Dot className={STATUS_DOT[status]} />
      {STATUS_LABELS_UZ[status]}
    </span>
  );
}

/** So'rov kartasining chap chetidagi rangli chiziq — ustuvorlikni bir qarashda ko'rsatadi. */
export function priorityBarClass(priority: Priority): string {
  const map: Record<Priority, string> = {
    [Priority.LOW]: "before:bg-priority-low",
    [Priority.MEDIUM]: "before:bg-priority-medium",
    [Priority.HIGH]: "before:bg-priority-high",
    [Priority.CRITICAL]: "before:bg-priority-critical",
  };
  return map[priority];
}
