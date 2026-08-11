import { useQuery } from "@tanstack/react-query";
import { RequestStatus } from "@app/shared-types";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { CheckCircle2 } from "lucide-react";

export function DirectorClosedRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "director"],
    queryFn: () => requestsApi.list({ pageSize: 100 }).then((r) => r.data),
  });

  const closedItems = data?.items.filter((r) => r.status === RequestStatus.CLOSED);

  return (
    <RequestList
      items={closedItems}
      isLoading={isLoading}
      emptyTitle="Tugatilgan zayavkalar yo'q"
      emptySubtitle="Yopilgan zayavkalar shu yerda ko'rinadi"
      emptyIcon={CheckCircle2}
    />
  );
}
