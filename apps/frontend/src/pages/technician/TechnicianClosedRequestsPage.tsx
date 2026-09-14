import { useQuery } from "@tanstack/react-query";
import { RequestStatus } from "@app/shared-types";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { ExportButtons } from "@/features/requests/ExportButtons";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/shared/i18n";

export function TechnicianClosedRequestsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "technician"],
    queryFn: () => requestsApi.list({ pageSize: 100 }).then((r) => r.data),
  });

  const closedItems = data?.items.filter((r) => r.status === RequestStatus.CLOSED);

  return (
    <div className="pt-2">
      <ExportButtons filters={{ status: RequestStatus.CLOSED }} />
      <RequestList
        items={closedItems}
        isLoading={isLoading}
        emptyTitle={t.technicians.myClosedTitle}
        emptySubtitle={t.technicians.myClosedSubtitle}
        emptyIcon={CheckCircle2}
      />
    </div>
  );
}
