import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Role } from "@app/shared-types";
import { usersApi, branchesApi, UserItem } from "@/shared/api";
import { Card, Spinner, EmptyState, Select, Button, StatusPill, Label } from "@/shared/ui/primitives";
import { SwipeRow } from "@/shared/ui/SwipeRow";
import { telegram, confirmDialog } from "@/shared/telegram/webapp";
import { Users, Check, Pencil, Trash2, Power, X } from "lucide-react";
import { Dictionary, useI18n } from "@/shared/i18n";

/** Superadmin panelida tanlash mumkin bo'lgan lavozimlar tartibi. */
const ROLE_ORDER: Role[] = [
  Role.DIRECTOR,
  Role.BRANCH_MANAGER,
  Role.REGIONAL_MANAGER,
  Role.EXECUTIVE,
  Role.CHIEF_TECHNICIAN,
  Role.TECHNICIAN,
  Role.SUPERADMIN,
];

/** Bitta filial biriktiriladigan lavozimlar. */
const SINGLE_BRANCH_ROLES: Role[] = [Role.DIRECTOR, Role.BRANCH_MANAGER, Role.TECHNICIAN];

function branchSummary(user: UserItem, t: Dictionary): string {
  if (user.role === Role.REGIONAL_MANAGER) {
    const names = (user.managedBranches ?? []).map((mb) => mb.branch.name);
    return names.length > 0 ? names.join(", ") : t.users.noBranches;
  }
  if (user.branch?.name) return user.branch.name;
  if (user.role === Role.TECHNICIAN) return t.users.allBranches;
  return "";
}

function UserRow({ user }: { user: UserItem }) {
  const { t, roleText } = useI18n();
  const queryClient = useQueryClient();
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
  });

  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<Role>(user.role);
  const [branchId, setBranchId] = useState<string>(user.branchId ?? "");
  const [branchIds, setBranchIds] = useState<string[]>(
    (user.managedBranches ?? []).map((mb) => mb.branchId)
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const roleMutation = useMutation({
    mutationFn: () =>
      usersApi.assignRole(user.id, {
        role,
        // Texnik uchun bo'sh qiymat = barcha filiallar (null).
        branchId: SINGLE_BRANCH_ROLES.includes(role) ? branchId || null : null,
        // Hududiy rahbar uchun ko'p filial biriktiruvi.
        ...(role === Role.REGIONAL_MANAGER ? { branchIds } : {}),
      }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setEditing(false);
      invalidate();
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? t.common.notSaved);
    },
  });

  const activeMutation = useMutation({
    mutationFn: (isActive: boolean) => usersApi.setActive(user.id, isActive),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.remove(user.id),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      invalidate();
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? t.common.notDeleted);
    },
  });

  // Direktor va Filial menejeri uchun filial MAJBURIY. Texnik uchun ixtiyoriy
  // (tanlanmasa — barcha filiallar). Hududiy rahbar uchun ko'p filial.
  const showsSingleBranch = SINGLE_BRANCH_ROLES.includes(role);
  const branchRequired = role === Role.DIRECTOR || role === Role.BRANCH_MANAGER;
  const showsMultiBranch = role === Role.REGIONAL_MANAGER;

  const saveDisabled =
    roleMutation.isPending ||
    (branchRequired && !branchId) ||
    (showsMultiBranch && branchIds.length === 0);

  function toggleBranch(id: string) {
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  async function handleDelete() {
    const ok = await confirmDialog(
      t.users.deleteConfirm(user.fullName || user.telegramId)
    );
    if (ok) deleteMutation.mutate();
  }

  const summary = branchSummary(user, t);

  const header = (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-extrabold text-tg-text text-[14.5px] truncate">
            {user.fullName || t.users.noName}
          </p>
          <p className="font-num text-[11px] text-inkFaint mt-0.5">TG ID {user.telegramId}</p>
          <p className="text-[12px] font-semibold text-tg-hint mt-1">
            {roleText(user.role)}
            {summary ? ` · ${summary}` : ""}
          </p>
        </div>
        <StatusPill active={user.isActive} />
      </div>
    </Card>
  );

  return (
    <div className="mb-2.5">
      <SwipeRow
        actions={[
          {
            key: "edit",
            label: t.common.edit,
            icon: Pencil,
            className: "bg-status-progress text-white",
            onClick: () => setEditing((v) => !v),
          },
          {
            key: "toggle",
            label: user.isActive ? t.common.makeInactive : t.common.makeActive,
            icon: Power,
            className: "bg-inkFaint text-white",
            onClick: () => activeMutation.mutate(!user.isActive),
          },
          {
            key: "delete",
            label: t.common.delete,
            icon: Trash2,
            className: "bg-priority-critical text-white",
            onClick: handleDelete,
          },
        ]}
      >
        {header}
      </SwipeRow>

      {editing && (
        <Card className="mt-1.5 !bg-tg-secondaryBg">
          <div className={`grid ${showsSingleBranch ? "grid-cols-2" : "grid-cols-1"} gap-2 mb-2.5`}>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="text-xs py-2"
            >
              {ROLE_ORDER.map((value) => (
                <option key={value} value={value}>
                  {roleText(value)}
                </option>
              ))}
            </Select>

            {showsSingleBranch && (
              <Select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="text-xs py-2"
              >
                <option value="">
                  {role === Role.TECHNICIAN ? t.users.allBranches : t.users.pickBranch}
                </option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {showsMultiBranch && (
            <div className="mb-2.5">
              <Label>{t.users.multiBranchLabel}</Label>
              <div className="max-h-52 overflow-y-auto rounded-control border border-line bg-tg-bg divide-y divide-line">
                {(branches ?? []).map((b) => {
                  const checked = branchIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBranch(b.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left active:opacity-70"
                    >
                      <span
                        className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition ${
                          checked ? "bg-accent border-accent text-white" : "border-lineStrong"
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="text-[13px] font-semibold text-tg-text truncate">{b.name}</span>
                    </button>
                  );
                })}
                {(branches ?? []).length === 0 && (
                  <p className="px-3 py-3 text-[12.5px] text-tg-hint">
                    {t.users.addBranchFirst}
                  </p>
                )}
              </div>
              <p className="text-[11.5px] text-tg-hint mt-1.5">
                {t.users.selectedCount(branchIds.length)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={Check}
              className="flex-1 !text-xs"
              disabled={saveDisabled}
              onClick={() => roleMutation.mutate()}
            >
              {t.common.save}
            </Button>
            <Button
              variant="ghost"
              icon={X}
              className="flex-1 !text-xs !border !border-lineStrong"
              onClick={() => setEditing(false)}
            >
              {t.common.cancel}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function SuperadminUsersPage() {
  const { t } = useI18n();
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  if (isLoading) return <Spinner label={t.common.loading} />;
  if (!users || users.length === 0)
    return (
      <EmptyState
        title={t.users.emptyTitle}
        subtitle={t.users.emptySubtitle}
        icon={Users}
      />
    );

  return (
    <div className="px-4 pt-2 pb-8">
      <p className="text-[12.5px] text-tg-hint mb-3.5 px-1 leading-relaxed">{t.users.hint}</p>
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </div>
  );
}
