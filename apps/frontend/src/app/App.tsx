import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Role } from "@app/shared-types";
import { useAuth } from "@/shared/hooks/useAuth";
import { Spinner, Button } from "@/shared/ui/primitives";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

import { DirectorRequestsPage } from "@/pages/director/DirectorRequestsPage";
import { DirectorClosedRequestsPage } from "@/pages/director/DirectorClosedRequestsPage";
import { DirectorNewRequestPage } from "@/pages/director/DirectorNewRequestPage";
import { ChiefAllRequestsPage } from "@/pages/chief-technician/ChiefAllRequestsPage";
import { ChiefTechniciansPage } from "@/pages/chief-technician/ChiefTechniciansPage";
import { TechnicianRequestsPage } from "@/pages/technician/TechnicianRequestsPage";
import { TechnicianClosedRequestsPage } from "@/pages/technician/TechnicianClosedRequestsPage";
import { SuperadminDashboardPage } from "@/pages/superadmin/SuperadminDashboardPage";
import { SuperadminUsersPage } from "@/pages/superadmin/SuperadminUsersPage";
import { SuperadminBranchesPage } from "@/pages/superadmin/SuperadminBranchesPage";
import { SuperadminCategoriesPage } from "@/pages/superadmin/SuperadminCategoriesPage";
import { SuperadminRequestsPage } from "@/pages/superadmin/SuperadminRequestsPage";
import { RequestDetailPage } from "@/features/requests/RequestDetailPage";

const HOME_BY_ROLE: Record<Role, string> = {
  [Role.DIRECTOR]: "/director/requests",
  [Role.CHIEF_TECHNICIAN]: "/chief/requests",
  [Role.TECHNICIAN]: "/technician/requests",
  [Role.SUPERADMIN]: "/superadmin/requests",
};

const TITLES: Record<string, string> = {
  "/director/requests": "Ochiq zayavkalar",
  "/director/closed": "Tugatilgan zayavkalar",
  "/director/stats": "Statistika",
  "/director/new": "Yangi zayavka",
  "/chief/requests": "Barcha zayavkalar",
  "/chief/technicians": "Texniklar nazorati",
  "/chief/dashboard": "Statistika",
  "/technician/requests": "Ochiq ishlar",
  "/technician/closed": "Tugatilgan ishlar",
  "/technician/stats": "Statistika",
  "/superadmin/requests": "Barcha zayavkalar",
  "/superadmin/dashboard": "Statistika",
  "/superadmin/users": "Foydalanuvchilar",
  "/superadmin/branches": "Filiallar",
  "/superadmin/categories": "Kategoriyalar",
};

function Shell({ role }: { role: Role }) {
  const location = useLocation();
  const isDetail = location.pathname.startsWith("/requests/");
  const title = isDetail ? "Zayavka tafsilotlari" : TITLES[location.pathname] ?? "Texnik Xizmat";

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

  if (isLoading) return <Spinner label="Kirilmoqda..." />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-tg-text font-medium">Kirishda xatolik</p>
        <p className="text-tg-hint text-sm">{error}</p>
        <Button onClick={retry}>Qayta urinish</Button>
      </div>
    );
  }

  if (!user) return null;

  return <Shell role={user.role} />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}
