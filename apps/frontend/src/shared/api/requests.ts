import { apiClient } from "./client";
import { Category, Priority, RequestStatus } from "@app/shared-types";

export interface RequestItem {
  id: string;
  branchId: string;
  branch: { id: string; name: string };
  createdBy: { id: string; fullName: string };
  chiefTechnician: { id: string; fullName: string } | null;
  technician: { id: string; fullName: string } | null;
  category: Category;
  description: string;
  priority: Priority;
  status: RequestStatus;
  beforePhotoUrl: string;
  afterPhotoUrl: string | null;
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
  category?: Category;
  technicianId?: string;
  page?: number;
  pageSize?: number;
}

export const requestsApi = {
  list: (filters: RequestFilters = {}) =>
    apiClient.get<RequestListResponse>("/requests", { params: filters }),

  getById: (id: string) => apiClient.get<RequestItem>(`/requests/${id}`),

  create: (data: {
    branchId: string;
    chiefTechnicianId?: string;
    category: Category;
    description: string;
    priority: Priority;
    beforePhotoUrl: string;
  }) => apiClient.post<RequestItem>("/requests", data),

  assignTechnician: (id: string, technicianId: string) =>
    apiClient.patch<RequestItem>(`/requests/${id}/assign`, { technicianId }),

  changeStatus: (id: string, status: RequestStatus, afterPhotoUrl?: string) =>
    apiClient.patch<RequestItem>(`/requests/${id}/status`, { status, afterPhotoUrl }),

  history: (id: string) => apiClient.get(`/requests/${id}/history`),
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
