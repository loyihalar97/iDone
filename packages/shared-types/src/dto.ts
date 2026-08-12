import { Category, NotificationType, Priority, RequestStatus, Role } from "./enums";

export interface UserDTO {
  id: string;
  telegramId: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  isActive: boolean;
}

export interface BranchDTO {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface RequestListItemDTO {
  id: string;
  branchId: string;
  branchName: string;
  category: Category;
  priority: Priority;
  status: RequestStatus;
  description: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string | null;
  createdByName: string;
  chiefTechnicianId: string | null;
  technicianId: string | null;
  technicianName: string | null;
  createdAt: string;
  closedAt: string | null;
}

export interface CreateRequestDTO {
  branchId: string;
  chiefTechnicianId?: string;
  category: Category;
  description: string;
  priority: Priority;
  beforePhotoUrl: string;
}

export interface AssignTechnicianDTO {
  technicianId: string;
}

export interface NotificationPayload {
  type: NotificationType;
  toTelegramId: string;
  requestId: string;
  text: string;
}

export interface DashboardStatsDTO {
  openCount: number;
  inProgressCount: number;
  closedTodayCount: number;
  closedThisMonthCount: number;
  avgResolutionHours: number;
  topBranchesByRequests: { branchName: string; count: number }[];
  busiestTechnicians: { technicianName: string; count: number }[];
}
