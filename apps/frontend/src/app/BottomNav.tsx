import { NavLink } from "react-router-dom";
import { Role } from "@app/shared-types";

interface TabItem {
  to: string;
  label: string;
  icon: string;
}

const TABS_BY_ROLE: Record<Role, TabItem[]> = {
  [Role.DIRECTOR]: [
    { to: "/director/requests", label: "Zayavkalar", icon: "📋" },
    { to: "/director/new", label: "Yangi", icon: "➕" },
  ],
  [Role.CHIEF_TECHNICIAN]: [
    { to: "/chief/requests", label: "Zayavkalar", icon: "📋" },
    { to: "/chief/dashboard", label: "Statistika", icon: "📊" },
  ],
  [Role.TECHNICIAN]: [{ to: "/technician/requests", label: "Ishlarim", icon: "🔧" }],
  [Role.SUPERADMIN]: [
    { to: "/superadmin/requests", label: "Zayavkalar", icon: "📋" },
    { to: "/superadmin/dashboard", label: "Statistika", icon: "📊" },
    { to: "/superadmin/users", label: "Foydalanuvchilar", icon: "👥" },
    { to: "/superadmin/branches", label: "Filiallar", icon: "🏢" },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const tabs = TABS_BY_ROLE[role] ?? [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tg-bg border-t border-black/10 safe-bottom">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive ? "text-tg-link font-medium" : "text-tg-hint"
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
