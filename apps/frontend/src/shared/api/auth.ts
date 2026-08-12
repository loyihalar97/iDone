import { apiClient } from "./client";
import { Role } from "@app/shared-types";

export interface CurrentUser {
  id: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  branchName?: string | null;
  isActive: boolean;
}

export const authApi = {
  loginWithTelegram: (initData: string) =>
    apiClient.post<{ token: string; user: CurrentUser }>("/auth/telegram", { initData }),

  me: () => apiClient.get<CurrentUser>("/auth/me"),
};
