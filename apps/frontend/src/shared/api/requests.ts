import { apiClient } from "./client";
import { Priority, RequestStatus } from "@app/shared-types";

export interface RequestItem {
  id: string;
  branchId: string;
  branch: { id: string; name: string };
  createdBy: { id: string; fullName: string };
  chiefTechnician: { id: string; fullName: string } | null;
  technician: { id: string; fullName: string } | null;
  category: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  beforePhotoUrl: string;
  afterPhotoUrl: string | null;
  expenseAmount: number | null;
  sortOrder: number;
  createdAt: string;
  closedAt: string | null;
}

export interface RequestListResponse {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RequestFilters {
  branchId?: string;
  status?: RequestStatus;
  priority?: Priority;
  category?: string;
  technicianId?: string;
  page?: number;
  pageSize?: number;
}

export const requestsApi = {
  list: (filters: RequestFilters = {}) =>
    apiClient.get<RequestListResponse>("/requests", { params: filters }),

  getById: (id: string) => apiClient.get<RequestItem>(`/requests/${id}`),

  create: (data: {
    category: string;
    description: string;
    priority: Priority;
    beforePhotoUrl: string;
  }) => apiClient.post<RequestItem>("/requests", data),

  assignTechnician: (id: string, technicianId: string) =>
    apiClient.patch<RequestItem>(`/requests/${id}/assign`, { technicianId }),

  changeStatus: (id: string, status: RequestStatus, afterPhotoUrl?: string, expenseAmount?: number) =>
    apiClient.patch<RequestItem>(`/requests/${id}/status`, { status, afterPhotoUrl, expenseAmount }),

  // Bosh texnik drag-and-drop orqali ish ketma-ketligini saqlaydi.
  reorder: (orderedIds: string[]) =>
    apiClient.patch<{ success: boolean }>("/requests/reorder", { orderedIds }),

  // Tarixni PDF/XLSX faylga eksport qilib, bot chatiga yuboradi.
  exportHistory: (format: "pdf" | "xlsx", filters: RequestFilters = {}) =>
    apiClient.get<{ success: boolean; count: number }>("/requests/export", {
      params: { ...filters, format, page: undefined, pageSize: undefined },
    }),

  history: (id: string) => apiClient.get(`/requests/${id}/history`),

  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/requests/${id}`),
};

export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ url: string }>("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
