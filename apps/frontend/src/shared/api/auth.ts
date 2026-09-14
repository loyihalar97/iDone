import { apiClient } from "./client";
import { Language, Role } from "@app/shared-types";

export interface CurrentUser {
  id: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  branchName?: string | null;
  /** Hududiy rahbarga biriktirilgan filiallar. */
  managedBranches: { id: string; name: string }[];
  isActive: boolean;
  /** Tanlangan interfeys tili. null — foydalanuvchi hali tanlamagan. */
  language: Language | null;
}

export const authApi = {
  loginWithTelegram: (initData: string) =>
    apiClient.post<{ token: string; user: CurrentUser }>("/auth/telegram", { initData }),

  me: () => apiClient.get<CurrentUser>("/auth/me"),

  /** Tanlangan tilni serverda saqlaydi (bildirishnoma va hisobotlar uchun ham). */
  setLanguage: (language: Language) =>
    apiClient.patch<CurrentUser>("/users/me/language", { language }),
};
