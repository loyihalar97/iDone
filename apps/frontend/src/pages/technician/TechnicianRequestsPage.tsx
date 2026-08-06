import { useQuery } from "@tanstack/react-query";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";

export function TechnicianRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "technician"],
    queryFn: () => requestsApi.list({ pageSize: 50 }).then((r) => r.data),
  });

  return (
    <RequestList
      items={data?.items}
      isLoading={isLoading}
      emptyTitle="Sizga biriktirilgan ishlar yo'q"
      emptySubtitle="Bosh texnik yangi ish biriktirganda shu yerda ko'rinadi"
    />
  );
}
