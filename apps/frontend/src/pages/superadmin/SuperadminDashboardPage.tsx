import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Role } from "@app/shared-types";
import { dashboardApi, notificationsApi } from "@/shared/api";
import { Card, Spinner, Textarea, Button } from "@/shared/ui/primitives";
import { LucideIcon, Inbox, Clock, CheckCircle2, CalendarCheck, Timer, Megaphone, Send } from "lucide-react";
import { telegram, confirmDialog } from "@/shared/telegram/webapp";
import { useI18n } from "@/shared/i18n";
import { useAuth } from "@/shared/hooks/useAuth";

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

/**
 * Superadmin botdan foydalanadigan BARCHA faol xodimlarning shaxsiy Telegram
 * chatiga bir vaqtda xabar yubora oladi (masalan: texnik ishlar haqida
 * ogohlantirish). Backend buni kichik partiyalarda yuboradi (Telegram
 * limitidan asraydi), shuning uchun bir nechta soniya davom etishi mumkin.
 */
function BroadcastCard() {
  const { t } = useI18n();
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: () => notificationsApi.broadcast(text.trim()).then((r) => r.data),
    onSuccess: (result) => {
      if (result.total === 0) {
        telegram.showAlert(t.broadcast.noRecipients);
        return;
      }
      telegram.HapticFeedback.notificationOccurred(result.failed > 0 ? "warning" : "success");
      telegram.showAlert(t.broadcast.result(result.sent, result.failed));
      setText("");
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? t.common.notSaved);
    },
  });

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) {
      telegram.showAlert(t.broadcast.emptyText);
      return;
    }
    const ok = await confirmDialog(t.broadcast.confirm);
    if (ok) mutation.mutate();
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center bg-accentSoft text-accent flex-shrink-0">
          <Megaphone size={15} strokeWidth={2} />
        </div>
        <p className="font-extrabold text-tg-text text-[13.5px]">{t.broadcast.title}</p>
      </div>
      <p className="text-[12px] font-medium text-tg-hint mb-2.5">{t.broadcast.hint}</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.broadcast.placeholder}
        rows={3}
        maxLength={4000}
        className="mb-2.5"
      />
      <Button onClick={handleSend} disabled={mutation.isPending || !text.trim()} className="w-full">
        <span className="inline-flex items-center justify-center gap-1.5">
          <Send size={14} strokeWidth={2.25} />
          {mutation.isPending ? t.broadcast.sending : t.broadcast.send}
        </span>
      </Button>
    </Card>
  );
}

export function SuperadminDashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  if (isLoading || !data) return <Spinner label={t.dashboard.loading} />;

  // "Barchaga xabar yuborish" (bot orqali) faqat SuperAdmin uchun ko'rinadi.
  // Bu sahifa Direktor / Bosh texnik / Texnik / Menejer rollari uchun ham
  // umumiy statistika ekrani sifatida qayta ishlatiladi, shuning uchun
  // BroadcastCard shu yerda rolga qarab yashiriladi.
  const isSuperAdmin = user?.role === Role.SUPERADMIN;

  return (
    <div className="px-4 pt-2 pb-8 space-y-3">
      {isSuperAdmin && <BroadcastCard />}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t.dashboard.openRequests}
          value={data.openCount}
          icon={Inbox}
          tint="bg-accentSoft text-accent"
        />
        <StatCard
          label={t.dashboard.inProgress}
          value={data.inProgressCount}
          icon={Clock}
          tint="bg-status-progress/10 text-status-progress"
        />
        <StatCard
          label={t.dashboard.closedToday}
          value={data.closedTodayCount}
          icon={CheckCircle2}
          tint="bg-status-directorAccepted/10 text-status-directorAccepted"
        />
        <StatCard
          label={t.dashboard.closedThisMonth}
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
            {data.avgResolutionHours} {t.dashboard.hours}
          </p>
          <p className="text-[12px] font-semibold text-tg-hint mt-1">
            {t.dashboard.avgResolution}
          </p>
        </div>
      </Card>

      {data.topBranchesByRequests.length > 0 && (
        <Card>
          <p className="font-extrabold text-tg-text text-[13px] mb-3">{t.dashboard.topBranches}</p>
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
          <p className="font-extrabold text-tg-text text-[13px] mb-3">
            {t.dashboard.busiestTechnicians}
          </p>
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
