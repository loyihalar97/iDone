import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Role } from "@app/shared-types";
import { usersApi, branchesApi, UserItem } from "@/shared/api";
import { Card, Spinner, EmptyState, Select, Button, StatusPill } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { Users, Check } from "lucide-react";

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
    <Card className="mb-2.5">
      <div className="flex items-start justify-between gap-2 mb-3.5">
        <div className="min-w-0">
          <p className="font-extrabold text-tg-text text-[14.5px] truncate">
            {user.fullName || "Ism ko'rsatilmagan"}
          </p>
          <p className="font-num text-[11px] text-inkFaint mt-0.5">TG ID {user.telegramId}</p>
        </div>
        <StatusPill active={user.isActive} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5">
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
        <Button
          variant="secondary"
          icon={Check}
          className="flex-1 !text-xs"
          disabled={roleMutation.isPending || (needsBranch && !branchId)}
          onClick={() => roleMutation.mutate()}
        >
          Saqlash
        </Button>
        <Button
          variant="ghost"
          className="flex-1 !text-xs !border !border-lineStrong"
          disabled={activeMutation.isPending}
          onClick={() => activeMutation.mutate(!user.isActive)}
        >
          {user.isActive ? "Faolsizlantirish" : "Faollashtirish"}
        </Button>
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
      <p className="text-[12.5px] text-tg-hint mb-3.5 px-1 leading-relaxed">
        Yangi foydalanuvchi botga /start bosganda ro'yxatga avtomatik qo'shiladi, lekin superadmin
        rol tayinlab faollashtirmaguncha tizimga kira olmaydi.
      </p>
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </div>
  );
}
