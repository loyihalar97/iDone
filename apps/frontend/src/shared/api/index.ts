import { apiClient } from "./client";
import { Role } from "@app/shared-types";

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export const branchesApi = {
  list: (activeOnly = true) => apiClient.get<Branch[]>("/branches", { params: { activeOnly } }),
  create: (data: { name: string; address?: string }) => apiClient.post<Branch>("/branches", data),
  update: (id: string, data: Partial<{ name: string; address: string; isActive: boolean }>) =>
    apiClient.patch<Branch>(`/branches/${id}`, data),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/branches/${id}`),
};

export interface UserItem {
  id: string;
  telegramId: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  isActive: boolean;
  branch?: { name: string } | null;
}

export const usersApi = {
  list: (filters: Partial<{ role: Role; branchId: string; isActive: boolean }> = {}) =>
    apiClient.get<UserItem[]>("/users", { params: filters }),

  technicians: (branchId?: string) =>
    apiClient.get<{ id: string; fullName: string; branchId: string | null }[]>("/users/technicians", {
      params: { branchId },
    }),

  chiefTechnicians: () =>
    apiClient.get<{ id: string; fullName: string }[]>("/users/chief-technicians"),

  assignRole: (id: string, data: { role: Role; branchId?: string | null; isActive?: boolean }) =>
    apiClient.patch<UserItem>(`/users/${id}/role`, data),

  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<UserItem>(`/users/${id}/active`, { isActive }),

  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/users/${id}`),
};

export interface TaskCategory {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export const categoriesApi = {
  list: () => apiClient.get<{ value: string; label: string }[]>("/categories"),
  priorities: () => apiClient.get<{ value: string; label: string }[]>("/categories/priorities"),
  statuses: () => apiClient.get<{ value: string; label: string }[]>("/categories/statuses"),

  // Superadmin boshqaruvi
  manage: () => apiClient.get<TaskCategory[]>("/categories/manage"),
  create: (data: { label: string; key?: string }) =>
    apiClient.post<TaskCategory>("/categories", data),
  update: (id: string, data: Partial<{ label: string; isActive: boolean; sortOrder: number }>) =>
    apiClient.patch<TaskCategory>(`/categories/${id}`, data),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/categories/${id}`),
};

export interface DashboardStats {
  openCount: number;
  inProgressCount: number;
  closedTodayCount: number;
  closedThisMonthCount: number;
  avgResolutionHours: number;
  topBranchesByRequests: { branchName: string; count: number }[];
  busiestTechnicians: { technicianName: string; count: number }[];
}

export const dashboardApi = {
  stats: () => apiClient.get<DashboardStats>("/dashboard/stats"),
};
