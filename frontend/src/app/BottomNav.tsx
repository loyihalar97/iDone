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
import { Dictionary, useI18n } from "@/shared/i18n";

interface NavItem {
  to: string;
  /** Lug'atdagi matnni tanlab beruvchi funksiya — til almashsa yorliq ham o'zgaradi. */
  label: (t: Dictionary) => string;
  icon: LucideIcon;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  [Role.DIRECTOR]: [
    { to: "/director/requests", label: (t) => t.nav.open, icon: ListChecks },
    { to: "/director/closed", label: (t) => t.nav.done, icon: CheckCircle2 },
    { to: "/director/new", label: (t) => t.nav.new, icon: PlusCircle },
    { to: "/director/stats", label: (t) => t.nav.stats, icon: BarChart3 },
  ],
  [Role.CHIEF_TECHNICIAN]: [
    { to: "/chief/requests", label: (t) => t.nav.requests, icon: ListChecks },
    { to: "/chief/technicians", label: (t) => t.nav.technicians, icon: Users },
    { to: "/chief/dashboard", label: (t) => t.nav.stats, icon: BarChart3 },
  ],
  [Role.TECHNICIAN]: [
    { to: "/technician/requests", label: (t) => t.nav.open, icon: ListChecks },
    { to: "/technician/closed", label: (t) => t.nav.done, icon: CheckCircle2 },
    { to: "/technician/stats", label: (t) => t.nav.stats, icon: BarChart3 },
  ],
  [Role.SUPERADMIN]: [
    { to: "/superadmin/requests", label: (t) => t.nav.requests, icon: ListChecks },
    { to: "/superadmin/dashboard", label: (t) => t.nav.stats, icon: BarChart3 },
    { to: "/superadmin/users", label: (t) => t.nav.staff, icon: Users },
    { to: "/superadmin/branches", label: (t) => t.nav.branches, icon: Building2 },
    { to: "/superadmin/categories", label: (t) => t.nav.categories, icon: Tags },
  ],
  // Hududiy rahbar — biriktirilgan filiallari bo'yicha.
  [Role.REGIONAL_MANAGER]: [
    { to: "/manager/requests", label: (t) => t.nav.open, icon: ListChecks },
    { to: "/manager/closed", label: (t) => t.nav.history, icon: CheckCircle2 },
    { to: "/manager/new", label: (t) => t.nav.new, icon: PlusCircle },
    { to: "/manager/stats", label: (t) => t.nav.stats, icon: BarChart3 },
  ],
  // Rahbar — barcha filiallar + texniklar nazorati.
  [Role.EXECUTIVE]: [
    { to: "/manager/requests", label: (t) => t.nav.requests, icon: ListChecks },
    { to: "/manager/closed", label: (t) => t.nav.history, icon: CheckCircle2 },
    { to: "/manager/technicians", label: (t) => t.nav.technicians, icon: Users },
    { to: "/manager/new", label: (t) => t.nav.new, icon: PlusCircle },
    { to: "/manager/stats", label: (t) => t.nav.stats, icon: BarChart3 },
  ],
  // Filial menejeri — faqat o'z filiali.
  [Role.BRANCH_MANAGER]: [
    { to: "/manager/requests", label: (t) => t.nav.open, icon: ListChecks },
    { to: "/manager/closed", label: (t) => t.nav.history, icon: CheckCircle2 },
    { to: "/manager/new", label: (t) => t.nav.new, icon: PlusCircle },
    { to: "/manager/stats", label: (t) => t.nav.stats, icon: BarChart3 },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const { t } = useI18n();
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
                  {label(t)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
