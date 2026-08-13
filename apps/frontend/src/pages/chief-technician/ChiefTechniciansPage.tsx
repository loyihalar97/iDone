import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/shared/api";
import { Card, Spinner, EmptyState, StatusPill } from "@/shared/ui/primitives";
import { Users } from "lucide-react";

/**
 * Bosh texnik uchun texniklar nazorati: har bir texnikning filiali va
 * ish yuklamasi (yangi / jarayonda / yakunlangan / yopilgan) kesimi.
 */
export function ChiefTechniciansPage() {
  const { data: technicians, isLoading } = useQuery({
    queryKey: ["technicians-overview"],
    queryFn: () => usersApi.techniciansOverview().then((r) => r.data),
    refetchInterval: 30_000, // nazorat sahifasi — har 30 soniyada yangilanadi
  });

  if (isLoading) return <Spinner label="Yuklanmoqda..." />;
  if (!technicians || technicians.length === 0)
    return (
      <EmptyState
        title="Texniklar yo'q"
        subtitle="Superadmin texnik rolini tayinlaganda shu yerda ko'rinadi"
        icon={Users}
      />
    );

  return (
    <div className="px-4 pt-2 pb-8 space-y-2.5">
      {technicians.map((t) => {
        const activeLoad = t.newCount + t.inProgressCount;
        return (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-extrabold text-tg-text text-[14.5px] truncate">{t.fullName}</p>
                <p className="text-[12px] font-semibold text-tg-hint mt-0.5">
                  {t.branchName ?? "Barcha filiallar"}
                </p>
              </div>
              <StatusPill active={t.isActive} />
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-3">
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-status-new">{t.newCount}</p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">Yangi</p>
              </div>
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-status-progress">
                  {t.inProgressCount}
                </p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">Jarayonda</p>
              </div>
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-tg-text">{t.completedCount}</p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">Yakunlagan</p>
              </div>
              <div className="rounded-control bg-tg-secondaryBg px-2 py-2 text-center">
                <p className="font-num font-extrabold text-[15px] text-status-closed">{t.closedCount}</p>
                <p className="text-[10px] font-semibold text-inkFaint mt-0.5">Yopilgan</p>
              </div>
            </div>

            {activeLoad === 0 && (
              <p className="text-[11.5px] text-tg-hint mt-2">Hozir bo'sh — yangi ish biriktirish mumkin</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
