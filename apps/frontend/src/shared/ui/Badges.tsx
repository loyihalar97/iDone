import { Priority, RequestStatus, PRIORITY_LABELS_UZ, STATUS_LABELS_UZ } from "@app/shared-types";

const PRIORITY_STYLES: Record<Priority, string> = {
  [Priority.LOW]: "bg-gray-100 text-gray-600",
  [Priority.MEDIUM]: "bg-blue-100 text-blue-700",
  [Priority.HIGH]: "bg-amber-100 text-amber-700",
  [Priority.CRITICAL]: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "bg-blue-100 text-blue-700",
  [RequestStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "bg-violet-100 text-violet-700",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "bg-cyan-100 text-cyan-700",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "bg-green-100 text-green-700",
  [RequestStatus.CLOSED]: "bg-gray-200 text-gray-600",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS_UZ[priority]}
    </span>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS_UZ[status]}
    </span>
  );
}
