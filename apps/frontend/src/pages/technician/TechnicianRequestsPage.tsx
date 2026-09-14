import { useQuery } from "@tanstack/react-query";
import { RequestStatus } from "@app/shared-types";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { Wrench } from "lucide-react";
import { useI18n } from "@/shared/i18n";

export function TechnicianRequestsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "technician"],
    queryFn: () => requestsApi.list({ pageSize: 100 }).then((r) => r.data),
  });

  const openItems = data?.items.filter((r) => r.status !== RequestStatus.CLOSED);

  return (
    <RequestList
      items={openItems}
      isLoading={isLoading}
      emptyTitle={t.technicians.myEmptyTitle}
      emptySubtitle={t.technicians.myEmptySubtitle}
      emptyIcon={Wrench}
    />
  );
}
