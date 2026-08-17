import { NavLink } from "react-router-dom";
import { Role } from "@app/shared-types";
import {
  ListChecks,
  CheckCircle2,
  BarChart3,
  PlusCircle,
  Users,
  Building2,
  Tags,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  [Role.DIRECTOR]: [
    { to: "/director/requests", label: "Ochiq", icon: ListChecks },
    { to: "/director/closed", label: "Tugagan", icon: CheckCircle2 },
    { to: "/director/new", label: "Yangi", icon: PlusCircle },
    { to: "/director/stats", label: "Statistika", icon: BarChart3 },
  ],
  [Role.CHIEF_TECHNICIAN]: [
    { to: "/chief/requests", label: "Zayavkalar", icon: ListChecks },
    { to: "/chief/technicians", label: "Texniklar", icon: Users },
    { to: "/chief/dashboard", label: "Statistika", icon: BarChart3 },
  ],
  [Role.TECHNICIAN]: [
    { to: "/technician/requests", label: "Ochiq", icon: ListChecks },
    { to: "/technician/closed", label: "Tugagan", icon: CheckCircle2 },
    { to: "/technician/stats", label: "Statistika", icon: BarChart3 },
  ],
  [Role.SUPERADMIN]: [
    { to: "/superadmin/requests", label: "Zayavkalar", icon: ListChecks },
    { to: "/superadmin/dashboard", label: "Statistika", icon: BarChart3 },
    { to: "/superadmin/users", label: "Xodimlar", icon: Users },
    { to: "/superadmin/branches", label: "Filiallar", icon: Building2 },
    { to: "/superadmin/categories", label: "Kategoriya", icon: Tags },
  ],
  // Hududiy rahbar — biriktirilgan filiallari bo'yicha.
  [Role.REGIONAL_MANAGER]: [
    { to: "/manager/requests", label: "Ochiq", icon: ListChecks },
    { to: "/manager/closed", label: "Tarix", icon: CheckCircle2 },
    { to: "/manager/new", label: "Yangi", icon: PlusCircle },
    { to: "/manager/stats", label: "Statistika", icon: BarChart3 },
  ],
  // Rahbar — barcha filiallar + texniklar nazorati.
  [Role.EXECUTIVE]: [
    { to: "/manager/requests", label: "Zayavkalar", icon: ListChecks },
    { to: "/manager/closed", label: "Tarix", icon: CheckCircle2 },
    { to: "/manager/technicians", label: "Texniklar", icon: Users },
    { to: "/manager/new", label: "Yangi", icon: PlusCircle },
    { to: "/manager/stats", label: "Statistika", icon: BarChart3 },
  ],
  // Filial menejeri — faqat o'z filiali.
  [Role.BRANCH_MANAGER]: [
    { to: "/manager/requests", label: "Ochiq", icon: ListChecks },
    { to: "/manager/closed", label: "Tarix", icon: CheckCircle2 },
    { to: "/manager/new", label: "Yangi", icon: PlusCircle },
    { to: "/manager/stats", label: "Statistika", icon: BarChart3 },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const items = NAV_BY_ROLE[role];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-tg-bg/95 backdrop-blur-md border-t border-line safe-bottom">
      <div className="flex items-stretch justify-around px-2 pt-2 pb-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-1 min-w-0"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition ${
                    isActive ? "bg-accentSoft text-accent" : "text-inkFaint"
                  }`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                <span
                  className={`text-[10px] leading-none truncate max-w-full ${
                    isActive ? "text-accent font-bold" : "text-inkFaint font-semibold"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
