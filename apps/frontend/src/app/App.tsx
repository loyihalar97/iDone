import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Role } from "@app/shared-types";
import { useAuth } from "@/shared/hooks/useAuth";
import { useI18n, Dictionary } from "@/shared/i18n";
import { LanguagePicker } from "@/shared/ui/LanguageSwitch";
import { Spinner, Button } from "@/shared/ui/primitives";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { HOME_BY_ROLE, isManagerRole } from "@/shared/lib/roles";

import { DirectorRequestsPage } from "@/pages/director/DirectorRequestsPage";
import { DirectorClosedRequestsPage } from "@/pages/director/DirectorClosedRequestsPage";
import { DirectorNewRequestPage } from "@/pages/director/DirectorNewRequestPage";
import { ChiefAllRequestsPage } from "@/pages/chief-technician/ChiefAllRequestsPage";
import { ChiefTechniciansPage } from "@/pages/chief-technician/ChiefTechniciansPage";
import { TechnicianRequestsPage } from "@/pages/technician/TechnicianRequestsPage";
import { TechnicianClosedRequestsPage } from "@/pages/technician/TechnicianClosedRequestsPage";
import { ManagerRequestsPage } from "@/pages/manager/ManagerRequestsPage";
import { ManagerClosedRequestsPage } from "@/pages/manager/ManagerClosedRequestsPage";
import { ManagerNewRequestPage } from "@/pages/manager/ManagerNewRequestPage";
import { SuperadminDashboardPage } from "@/pages/superadmin/SuperadminDashboardPage";
import { SuperadminUsersPage } from "@/pages/superadmin/SuperadminUsersPage";
import { SuperadminBranchesPage } from "@/pages/superadmin/SuperadminBranchesPage";
import { SuperadminCategoriesPage } from "@/pages/superadmin/SuperadminCategoriesPage";
import { SuperadminRequestsPage } from "@/pages/superadmin/SuperadminRequestsPage";
import { RequestDetailPage } from "@/features/requests/RequestDetailPage";

/** Sahifa sarlavhalari — tanlangan tildagi lug'atdan olinadi. */
function pageTitles(t: Dictionary): Record<string, string> {
  return {
    "/director/requests": t.titles.directorRequests,
    "/director/closed": t.titles.directorClosed,
    "/director/stats": t.titles.stats,
    "/director/new": t.titles.newRequest,
    "/chief/requests": t.titles.chiefRequests,
    "/chief/technicians": t.titles.chiefTechnicians,
    "/chief/dashboard": t.titles.stats,
    "/technician/requests": t.titles.technicianOpen,
    "/technician/closed": t.titles.technicianClosed,
    "/technician/stats": t.titles.stats,
    "/manager/requests": t.titles.managerRequests,
    "/manager/closed": t.titles.managerClosed,
    "/manager/new": t.titles.newRequest,
    "/manager/technicians": t.titles.chiefTechnicians,
    "/manager/stats": t.titles.stats,
    "/superadmin/requests": t.titles.superadminRequests,
    "/superadmin/dashboard": t.titles.stats,
    "/superadmin/users": t.titles.users,
    "/superadmin/branches": t.titles.branches,
    "/superadmin/categories": t.titles.categories,
  };
}

function Shell({ role }: { role: Role }) {
  const location = useLocation();
  const { t } = useI18n();
  const isDetail = location.pathname.startsWith("/requests/");
  const title = isDetail
    ? t.titles.requestDetails
    : pageTitles(t)[location.pathname] ?? t.appTitle;

  return (
    <div className="min-h-screen pb-24">
      <Header title={title} showBack={isDetail} />
      <Routes>
        <Route path="/" element={<Navigate to={HOME_BY_ROLE[role]} replace />} />

        {role === Role.DIRECTOR && (
          <>
            <Route path="/director/requests" element={<DirectorRequestsPage />} />
            <Route path="/director/closed" element={<DirectorClosedRequestsPage />} />
            <Route path="/director/stats" element={<SuperadminDashboardPage />} />
            <Route path="/director/new" element={<DirectorNewRequestPage />} />
          </>
        )}

        {role === Role.CHIEF_TECHNICIAN && (
          <>
            <Route path="/chief/requests" element={<ChiefAllRequestsPage />} />
            <Route path="/chief/technicians" element={<ChiefTechniciansPage />} />
            <Route path="/chief/dashboard" element={<SuperadminDashboardPage />} />
          </>
        )}

        {role === Role.TECHNICIAN && (
          <>
            <Route path="/technician/requests" element={<TechnicianRequestsPage />} />
            <Route path="/technician/closed" element={<TechnicianClosedRequestsPage />} />
            <Route path="/technician/stats" element={<SuperadminDashboardPage />} />
          </>
        )}

        {/* Rahbar / Hududiy rahbar / Filial menejeri uchun umumiy panel */}
        {isManagerRole(role) && (
          <>
            <Route path="/manager/requests" element={<ManagerRequestsPage />} />
            <Route path="/manager/closed" element={<ManagerClosedRequestsPage />} />
            <Route path="/manager/new" element={<ManagerNewRequestPage />} />
            <Route path="/manager/stats" element={<SuperadminDashboardPage />} />
            {role === Role.EXECUTIVE && (
              <Route path="/manager/technicians" element={<ChiefTechniciansPage />} />
            )}
          </>
        )}

        {role === Role.SUPERADMIN && (
          <>
            <Route path="/superadmin/requests" element={<SuperadminRequestsPage />} />
            <Route path="/superadmin/dashboard" element={<SuperadminDashboardPage />} />
            <Route path="/superadmin/users" element={<SuperadminUsersPage />} />
            <Route path="/superadmin/branches" element={<SuperadminBranchesPage />} />
            <Route path="/superadmin/categories" element={<SuperadminCategoriesPage />} />
          </>
        )}

        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="*" element={<Navigate to={HOME_BY_ROLE[role]} replace />} />
      </Routes>
      {!isDetail && <BottomNav role={role} />}
    </div>
  );
}

function AuthGate() {
  const { user, isLoading, error, retry } = useAuth();
  const { t } = useI18n();

  if (isLoading) return <Spinner label={t.auth.signingIn} />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-tg-text font-medium">{t.auth.signInError}</p>
        <p className="text-tg-hint text-sm">{error}</p>
        <Button onClick={retry}>{t.common.retry}</Button>
      </div>
    );
  }

  if (!user) return null;

  // Birinchi kirish: foydalanuvchi hali tilni tanlamagan bo'lsa, avval
  // tilni tanlaydi — keyin ilova o'sha tilda ochiladi.
  if (!user.language) return <LanguagePicker />;

  return <Shell role={user.role} />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}
