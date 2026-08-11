import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/shared/api";
import { Card, Spinner } from "@/shared/ui/primitives";
import { LucideIcon, Inbox, Clock, CheckCircle2, CalendarCheck, Timer } from "lucide-react";

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <Card>
      <Icon size={16} strokeWidth={1.75} className="text-tg-hint mb-2" />
      <p className="text-2xl font-semibold text-tg-text tracking-tight2">{value}</p>
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
    <div className="px-4 pt-2 pb-8 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ochiq zayavkalar" value={data.openCount} icon={Inbox} />
        <StatCard label="Jarayonda" value={data.inProgressCount} icon={Clock} />
        <StatCard label="Bugun yopilgan" value={data.closedTodayCount} icon={CheckCircle2} />
        <StatCard label="Oy davomida yopilgan" value={data.closedThisMonthCount} icon={CalendarCheck} />
      </div>

      <StatCard label="O'rtacha bajarilish vaqti (soat)" value={data.avgResolutionHours} icon={Timer} />

      <Card>
        <p className="font-medium text-tg-text text-sm mb-3">Eng ko'p muammo kelayotgan filiallar</p>
        <div className="space-y-2.5">
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
        <p className="font-medium text-tg-text text-sm mb-3">Eng band texniklar</p>
        <div className="space-y-2.5">
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
