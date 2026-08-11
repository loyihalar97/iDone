import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Role } from "@app/shared-types";
import { usersApi, branchesApi, UserItem } from "@/shared/api";
import { Card, Spinner, EmptyState, Select } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { Users } from "lucide-react";

const ROLE_LABELS: Record<Role, string> = {
  [Role.DIRECTOR]: "Filial direktori",
  [Role.CHIEF_TECHNICIAN]: "Bosh texnik",
  [Role.TECHNICIAN]: "Texnik",
  [Role.SUPERADMIN]: "Superadmin",
};

function UserRow({ user }: { user: UserItem }) {
  const queryClient = useQueryClient();
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
  });

  const [role, setRole] = useState<Role>(user.role);
  const [branchId, setBranchId] = useState<string>(user.branchId ?? "");

  const roleMutation = useMutation({
    mutationFn: () =>
      usersApi.assignRole(user.id, {
        role,
        branchId: role === Role.DIRECTOR || role === Role.TECHNICIAN ? branchId || null : null,
      }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const activeMutation = useMutation({
    mutationFn: (isActive: boolean) => usersApi.setActive(user.id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const needsBranch = role === Role.DIRECTOR || role === Role.TECHNICIAN;

  return (
    <Card className="mb-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-tg-text text-sm">{user.fullName || "Ism ko'rsatilmagan"}</p>
          <p className="text-xs text-tg-hint mt-0.5">Telegram ID: {user.telegramId}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-line text-xs font-medium text-tg-text">
          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-status-directorAccepted" : "bg-status-closed"}`} />
          {user.isActive ? "Faol" : "Faol emas"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className="text-xs py-2">
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        {needsBranch && (
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="text-xs py-2">
            <option value="">Filial tanlang</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => roleMutation.mutate()}
          disabled={roleMutation.isPending || (needsBranch && !branchId)}
          className="flex-1 text-xs py-2 rounded-control bg-tg-button text-tg-buttonText disabled:opacity-40"
        >
          Saqlash
        </button>
        <button
          onClick={() => activeMutation.mutate(!user.isActive)}
          disabled={activeMutation.isPending}
          className="flex-1 text-xs py-2 rounded-control border border-lineStrong text-tg-text"
        >
          {user.isActive ? "Faolsizlantirish" : "Faollashtirish"}
        </button>
      </div>
    </Card>
  );
}

export function SuperadminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  if (isLoading) return <Spinner label="Yuklanmoqda..." />;
  if (!users || users.length === 0)
    return (
      <EmptyState
        title="Foydalanuvchilar yo'q"
        subtitle="Botga /start bosgan foydalanuvchilar shu yerda ko'rinadi"
        icon={Users}
      />
    );

  return (
    <div className="px-4 pt-2 pb-8">
      <p className="text-xs text-tg-hint mb-3 px-1 leading-relaxed">
        Yangi foydalanuvchi botga /start bosganda ro'yxatga avtomatik qo'shiladi, lekin superadmin
        rol tayinlab faollashtirmaguncha tizimga kira olmaydi.
      </p>
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </div>
  );
}
