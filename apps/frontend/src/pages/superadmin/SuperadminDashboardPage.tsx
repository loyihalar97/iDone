import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/shared/api";
import { Card, Spinner } from "@/shared/ui/primitives";
import { LucideIcon, Inbox, Clock, CheckCircle2, CalendarCheck, Timer } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <Card>
      <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center mb-3 ${tint}`}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <p className="font-num text-[26px] font-semibold text-tg-text leading-none">{value}</p>
      <p className="text-[12px] font-semibold text-tg-hint mt-2">{label}</p>
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
        <StatCard label="Ochiq zayavkalar" value={data.openCount} icon={Inbox} tint="bg-accentSoft text-accent" />
        <StatCard label="Jarayonda" value={data.inProgressCount} icon={Clock} tint="bg-status-progress/10 text-status-progress" />
        <StatCard
          label="Bugun yopilgan"
          value={data.closedTodayCount}
          icon={CheckCircle2}
          tint="bg-status-directorAccepted/10 text-status-directorAccepted"
        />
        <StatCard
          label="Oy davomida yopilgan"
          value={data.closedThisMonthCount}
          icon={CalendarCheck}
          tint="bg-inkFaint/10 text-inkFaint"
        />
      </div>

      <Card className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-[10px] bg-accentSoft flex items-center justify-center flex-shrink-0 text-accent">
          <Timer size={17} strokeWidth={2} />
        </div>
        <div>
          <p className="font-num text-[22px] font-semibold text-tg-text leading-none">
            {data.avgResolutionHours} soat
          </p>
          <p className="text-[12px] font-semibold text-tg-hint mt-1">O'rtacha bajarilish vaqti</p>
        </div>
      </Card>

      {data.topBranchesByRequests.length > 0 && (
        <Card>
          <p className="font-extrabold text-tg-text text-[13px] mb-3">Eng ko'p muammo kelayotgan filiallar</p>
          <div>
            {(() => {
              const max = Math.max(...data.topBranchesByRequests.map((b) => b.count));
              return data.topBranchesByRequests.map((b, i) => (
                <div
                  key={b.branchName}
                  className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="text-[13px] font-bold text-tg-text w-20 flex-shrink-0 truncate">
                    {b.branchName}
                  </span>
                  <span className="flex-1 h-[7px] rounded-pill bg-tg-secondaryBg overflow-hidden">
                    <span
                      className="block h-full rounded-pill bg-accent"
                      style={{ width: `${(b.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="font-num text-[12px] font-semibold text-tg-hint w-6 text-right flex-shrink-0">
                    {b.count}
                  </span>
                </div>
              ));
            })()}
          </div>
        </Card>
      )}

      {data.busiestTechnicians.length > 0 && (
        <Card>
          <p className="font-extrabold text-tg-text text-[13px] mb-3">Eng band texniklar</p>
          <div>
            {(() => {
              const max = Math.max(...data.busiestTechnicians.map((t) => t.count));
              return data.busiestTechnicians.map((t, i) => (
                <div
                  key={t.technicianName}
                  className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="text-[13px] font-bold text-tg-text w-20 flex-shrink-0 truncate">
                    {t.technicianName}
                  </span>
                  <span className="flex-1 h-[7px] rounded-pill bg-tg-secondaryBg overflow-hidden">
                    <span
                      className="block h-full rounded-pill bg-status-techDone"
                      style={{ width: `${(t.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="font-num text-[12px] font-semibold text-tg-hint w-6 text-right flex-shrink-0">
                    {t.count}
                  </span>
                </div>
              ));
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
