import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/shared/api";
import { Card, Spinner } from "@/shared/ui/primitives";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-2xl font-bold text-tg-text">{value}</p>
      <p className="text-xs text-tg-hint mt-1">{label}</p>
    </Card>
  );
}

export function SuperadminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  if (isLoading || !data) return <Spinner label="Statistika yuklanmoqda..." />;

  return (
    <div className="px-4 pt-2 pb-8 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ochiq zayavkalar" value={data.openCount} />
        <StatCard label="Jarayonda" value={data.inProgressCount} />
        <StatCard label="Bugun yopilgan" value={data.closedTodayCount} />
        <StatCard label="Oy davomida yopilgan" value={data.closedThisMonthCount} />
      </div>

      <StatCard label="O'rtacha bajarilish vaqti (soat)" value={data.avgResolutionHours} />

      <Card>
        <p className="font-medium text-tg-text mb-3">Eng ko'p muammo kelayotgan filiallar</p>
        <div className="space-y-2">
          {data.topBranchesByRequests.length === 0 && (
            <p className="text-sm text-tg-hint">Ma'lumot yo'q</p>
          )}
          {data.topBranchesByRequests.map((b) => (
            <div key={b.branchName} className="flex justify-between text-sm">
              <span className="text-tg-text">{b.branchName}</span>
              <span className="text-tg-hint">{b.count} ta</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="font-medium text-tg-text mb-3">Eng band texniklar</p>
        <div className="space-y-2">
          {data.busiestTechnicians.length === 0 && (
            <p className="text-sm text-tg-hint">Ma'lumot yo'q</p>
          )}
          {data.busiestTechnicians.map((t) => (
            <div key={t.technicianName} className="flex justify-between text-sm">
              <span className="text-tg-text">{t.technicianName}</span>
              <span className="text-tg-hint">{t.count} ta</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
