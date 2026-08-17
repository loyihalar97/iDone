import { Role } from "@app/shared-types";

/** Har bir lavozim uchun bosh sahifa. */
export const HOME_BY_ROLE: Record<Role, string> = {
  [Role.DIRECTOR]: "/director/requests",
  [Role.CHIEF_TECHNICIAN]: "/chief/requests",
  [Role.TECHNICIAN]: "/technician/requests",
  [Role.SUPERADMIN]: "/superadmin/requests",
  [Role.REGIONAL_MANAGER]: "/manager/requests",
  [Role.EXECUTIVE]: "/manager/requests",
  [Role.BRANCH_MANAGER]: "/manager/requests",
};

/** "Rahbar" darajasidagi lavozimlar — umumiy `/manager/*` panelini ishlatadi. */
export const MANAGER_ROLES: Role[] = [
  Role.REGIONAL_MANAGER,
  Role.EXECUTIVE,
  Role.BRANCH_MANAGER,
];

export function isManagerRole(role: Role): boolean {
  return MANAGER_ROLES.includes(role);
}

/**
 * Zayavka ochayotganda filialni foydalanuvchi tanlashi kerakmi?
 * Direktor va Filial menejeri uchun filial profildan olinadi.
 */
export function needsBranchPicker(role: Role): boolean {
  return (
    role === Role.REGIONAL_MANAGER || role === Role.EXECUTIVE || role === Role.SUPERADMIN
  );
}
