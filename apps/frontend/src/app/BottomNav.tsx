import { NavLink } from "react-router-dom";
import { Role } from "@app/shared-types";
import {
  ClipboardList,
  CheckCircle2,
  Wrench,
  BarChart3,
  Users,
  Building2,
  LucideIcon,
} from "lucide-react";

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const TABS_BY_ROLE: Record<Role, TabItem[]> = {
  [Role.DIRECTOR]: [
    { to: "/director/requests", label: "Ochiq", icon: ClipboardList },
    { to: "/director/closed", label: "Tugatilgan", icon: CheckCircle2 },
  ],
  [Role.CHIEF_TECHNICIAN]: [
    { to: "/chief/requests", label: "Zayavkalar", icon: ClipboardList },
    { to: "/chief/dashboard", label: "Statistika", icon: BarChart3 },
  ],
  [Role.TECHNICIAN]: [
    { to: "/technician/requests", label: "Ochiq ishlar", icon: Wrench },
    { to: "/technician/closed", label: "Tugatilgan", icon: CheckCircle2 },
  ],
  [Role.SUPERADMIN]: [
    { to: "/superadmin/requests", label: "Zayavkalar", icon: ClipboardList },
    { to: "/superadmin/dashboard", label: "Statistika", icon: BarChart3 },
    { to: "/superadmin/users", label: "Foydalanuvchilar", icon: Users },
    { to: "/superadmin/branches", label: "Filiallar", icon: Building2 },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const tabs = TABS_BY_ROLE[role] ?? [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tg-bg/95 backdrop-blur border-t border-line safe-bottom">
      <div className="flex px-2 py-1.5 gap-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 rounded-control text-[11px] font-medium transition ${
                isActive ? "text-tg-text bg-tg-secondaryBg" : "text-tg-hint"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon size={19} strokeWidth={isActive ? 2 : 1.6} />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
