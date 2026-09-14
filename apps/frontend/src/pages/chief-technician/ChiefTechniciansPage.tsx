import { useQuery } from "@tanstack/react-query";
import { Role } from "@app/shared-types";
import { usersApi } from "@/shared/api";
import { Card, Spinner, EmptyState, StatusPill } from "@/shared/ui/primitives";
import { Users } from "lucide-react";
import { useI18n } from "@/shared/i18n";

/**
 * Bosh texnik uchun texniklar nazorati: har bir texnikning filiali va
 * ish yuklamasi (yangi / jarayonda / yakunlangan / yopilgan) kesimi.
 */
export function ChiefTechniciansPage() {
  const { t, roleText } = useI18n();
  const { data: technicians, isLoading } = useQuery({
    queryKey: ["technicians-overview"],
    queryFn: () => usersApi.techniciansOverview().then((r) => r.data),
    // Nazorat sahifasi fonda yangilanadi. Ilgari har 30 soniyada so'rov
    // ketardi — ochiq turgan har bir telefon kuniga ~2900 ta so'rov degani
    // (Railway'da bekorga CPU va trafik). 3 daqiqa bu sahifa uchun yetarli,
    // ekranga qaytilganda esa darhol yangilanadi.
    refetchInterval: 3 * 60_000,
    refetchOnWindowFocus: true,
    // Sahifa fonda (boshqa ilovaga o'tilganda) umuman so'rov yubormaydi.
    refetchIntervalInBackground: false,
  });

  if (isLoading) return <Spinner label={t.common.loading} />;
  if (!technicians || technicians.length === 0)
    return (
      <EmptyState
        title={t.technicians.emptyTitle}
        subtitle={t.technicians.emptySubtitle}
        icon={Users}
      />
    );

  return (
    <div className="px-4 pt-2 pb-8 space-y-2.5">
      {technicians.map((tech) => {
        const activeLoad = tech.newCount + tech.inProgressCount;
        return (
          <Card key={tech.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-extrabold text-tg-text text-[14.5px] truncate">
                  {tech.fullName}
                </p>
                <p className="text-[12px] font-semibold text-tg-hint mt-0.5">
                  {roleText(tech.role as Role)} ·{" "}
                  {tech.branchName ?? t.technicians.allBranches}
                </p>
              </div>
              <StatusPill active={tech.isActive} />
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-3">
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-status-new">
                  {tech.newCount}
                </p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">
                  {t.technicians.new}
                </p>
              </div>
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-status-progress">
                  {tech.inProgressCount}
                </p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">
                  {t.technicians.inProgress}
                </p>
              </div>
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-tg-text">
                  {tech.completedCount}
                </p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">
                  {t.technicians.completed}
                </p>
              </div>
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-status-closed">
                  {tech.closedCount}
                </p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">
                  {t.technicians.closed}
                </p>
              </div>
            </div>

            {activeLoad === 0 && (
              <p className="text-[11.5px] text-tg-hint mt-2">{t.technicians.free}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
