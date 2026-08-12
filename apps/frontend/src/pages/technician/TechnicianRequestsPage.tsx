import { useQuery } from "@tanstack/react-query";
import { RequestStatus } from "@app/shared-types";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { Wrench } from "lucide-react";

export function TechnicianRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "technician"],
    queryFn: () => requestsApi.list({ pageSize: 100 }).then((r) => r.data),
  });

  const openItems = data?.items.filter((r) => r.status !== RequestStatus.CLOSED);

  return (
    <RequestList
      items={openItems}
      isLoading={isLoading}
      emptyTitle="Sizga biriktirilgan ochiq ish yo'q"
      emptySubtitle="Bosh texnik yangi ish biriktirganda shu yerda ko'rinadi"
      emptyIcon={Wrench}
    />
  );
}
