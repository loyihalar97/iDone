import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { REQUEST_CREATOR_ROLES, Priority, RequestStatus, Role } from "@app/shared-types";
import { branchesApi, usersApi } from "@/shared/api";
import { RequestFilters as Filters } from "@/shared/api/requests";
import { Select } from "@/shared/ui/primitives";
import { useI18n } from "@/shared/i18n";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  /**
   * Texnik / yaratuvchi / lavozim kesimidagi filtrlarni ko'rsatish.
   * Rahbar, Bosh texnik va Superadmin uchun yoqiladi.
   */
  showPeopleFilters?: boolean;
}

/** Tez filtr chiplarida ko'rsatiladigan holatlar. */
const CHIP_STATUSES: (RequestStatus | undefined)[] = [
  undefined,
  RequestStatus.NEW,
  RequestStatus.IN_PROGRESS,
  RequestStatus.CLOSED,
];

const ALL_STATUSES: RequestStatus[] = [
  RequestStatus.NEW,
  RequestStatus.IN_PROGRESS,
  RequestStatus.COMPLETED_BY_TECHNICIAN,
  RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN,
  RequestStatus.ACCEPTED_BY_DIRECTOR,
  RequestStatus.CLOSED,
];

const ALL_PRIORITIES: Priority[] = [
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.CRITICAL,
];

export function RequestFiltersBar({ filters, onChange, showPeopleFilters = false }: Props) {
  const { t, statusText, priorityText, roleText } = useI18n();
  const [showMore, setShowMore] = useState(false);
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ["technicians", "all"],
    queryFn: () => usersApi.technicians().then((r) => r.data),
    enabled: showPeopleFilters,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["users", "creators"],
    queryFn: () => usersApi.list().then((r) => r.data),
    enabled: showPeopleFilters,
  });

  const creators = (allUsers ?? []).filter((u) => REQUEST_CREATOR_ROLES.includes(u.role));

  const hasExtraFilters =
    !!filters.branchId ||
    !!filters.priority ||
    !!filters.technicianId ||
    !!filters.createdById ||
    !!filters.createdByRole;

  const pill = "!w-auto flex-shrink-0 !rounded-pill text-xs py-2 bg-tg-secondaryBg";

  return (
    <div className="pt-3 pb-3">
      <div className="px-4 flex items-center gap-2">
        <div className="flex-1 flex gap-0.5 bg-tg-secondaryBg border border-line rounded-control p-1 overflow-x-auto no-scrollbar">
          {CHIP_STATUSES.map((chipStatus) => {
            const isActive = filters.status === chipStatus;
            const label = chipStatus ? statusText(chipStatus) : t.common.all;
            return (
              <button
                key={label}
                onClick={() => onChange({ ...filters, status: chipStatus })}
                className={`flex-1 flex-shrink-0 whitespace-nowrap text-[12.5px] font-bold px-3 py-2 rounded-[9px] transition ${
                  isActive ? "bg-tg-text text-tg-bg" : "text-inkSoft"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowMore((v) => !v)}
          className={`relative flex-shrink-0 w-10 h-10 rounded-control flex items-center justify-center transition border ${
            showMore || hasExtraFilters
              ? "bg-accentSoft text-accent border-transparent"
              : "bg-tg-bg text-inkFaint border-line"
          }`}
          aria-label={t.filters.more}
        >
          <SlidersHorizontal size={16} strokeWidth={2.25} />
          {hasExtraFilters && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {showMore && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar">
          <Select
            value={filters.status ?? ""}
            onChange={(e) => onChange({ ...filters, status: (e.target.value || undefined) as RequestStatus })}
            className={pill}
          >
            <option value="">{t.filters.allStatuses}</option>
            {ALL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusText(value)}
              </option>
            ))}
          </Select>

          <Select
            value={filters.branchId ?? ""}
            onChange={(e) => onChange({ ...filters, branchId: e.target.value || undefined })}
            className={pill}
          >
            <option value="">{t.filters.allBranches}</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select
            value={filters.priority ?? ""}
            onChange={(e) => onChange({ ...filters, priority: (e.target.value || undefined) as Priority })}
            className={pill}
          >
            <option value="">{t.filters.allPriorities}</option>
            {ALL_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {priorityText(value)}
              </option>
            ))}
          </Select>

          {showPeopleFilters && (
            <>
              <Select
                value={filters.technicianId ?? ""}
                onChange={(e) => onChange({ ...filters, technicianId: e.target.value || undefined })}
                className={pill}
              >
                <option value="">{t.filters.allTechnicians}</option>
                {technicians?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.createdById ?? ""}
                onChange={(e) => onChange({ ...filters, createdById: e.target.value || undefined })}
                className={pill}
              >
                <option value="">{t.filters.allCreators}</option>
                {creators.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.createdByRole ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, createdByRole: (e.target.value || undefined) as Role })
                }
                className={pill}
              >
                <option value="">{t.filters.allRoles}</option>
                {REQUEST_CREATOR_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleText(r)}
                  </option>
                ))}
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  );
}
