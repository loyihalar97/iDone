import { useQuery } from "@tanstack/react-query";
import { RequestStatus } from "@app/shared-types";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { ExportButtons } from "@/features/requests/ExportButtons";
import { CheckCircle2 } from "lucide-react";

export function TechnicianClosedRequestsPage() {
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
        emptyTitle="Tugatilgan ish yo'q"
        emptySubtitle="Siz yakunlagan ishlar shu yerda ko'rinadi"
        emptyIcon={CheckCircle2}
      />
    </div>
  );
}
