import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { authApi, CurrentUser } from "../api/auth";
import { getAuthToken, setAuthToken } from "../api/client";
import { getInitData, telegram } from "../telegram/webapp";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function login() {
      setIsLoading(true);
      setError(null);
      try {
        const existingToken = getAuthToken();
        if (existingToken) {
          const { data } = await authApi.me();
          if (!cancelled) setUser(data);
          return;
        }

        const initData = getInitData();
        if (!initData) {
          throw new Error(
            "Telegram initData topilmadi. Ilovani Telegram ichidan ochganingizga ishonch hosil qiling."
          );
        }

        const { data } = await authApi.loginWithTelegram(initData);
        setAuthToken(data.token);
        if (!cancelled) setUser(data.user as unknown as CurrentUser);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ??
              err?.message ??
              "Tizimga kirishda xatolik yuz berdi"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    login();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    telegram.ready();
    telegram.expand();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, retry: () => setAttempt((a) => a + 1) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
