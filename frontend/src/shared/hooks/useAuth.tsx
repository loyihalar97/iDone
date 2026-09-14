import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Language } from "@app/shared-types";
import { authApi, CurrentUser } from "../api/auth";
import { getAuthToken, setAuthToken } from "../api/client";
import { getInitData, telegram } from "../telegram/webapp";
import { useI18n } from "../i18n";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  /**
   * Tilni tanlash: interfeys darhol o'zgaradi va tanlov serverda saqlanadi,
   * shunda Telegram bildirishnomalari va PDF/Excel hisobotlar ham shu tilda
   * keladi.
   */
  chooseLanguage: (lang: Language) => Promise<void>;
  isSavingLanguage: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);

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
          throw new Error(t.auth.initDataMissing);
        }

        const { data } = await authApi.loginWithTelegram(initData);
        setAuthToken(data.token);
        if (!cancelled) setUser(data.user as unknown as CurrentUser);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ?? err?.message ?? t.auth.genericError
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Serverda saqlangan til — haqiqat manbai. Foydalanuvchi boshqa qurilmadan
  // kirsa ham o'zi tanlagan tilni ko'radi.
  useEffect(() => {
    if (user?.language && user.language !== lang) {
      setLang(user.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language]);

  useEffect(() => {
    telegram.ready();
    telegram.expand();
  }, []);

  async function chooseLanguage(next: Language) {
    // Interfeys darhol o'zgaradi — server javobini kutib turmaymiz.
    setLang(next);
    setIsSavingLanguage(true);
    try {
      const { data } = await authApi.setLanguage(next);
      setUser(data);
    } catch {
      // Saqlash muvaffaqiyatsiz bo'lsa ham interfeys tanlangan tilda qoladi
      // (tanlov brauzer xotirasida saqlanadi), keyingi urinishda yana yoziladi.
      setUser((prev) => (prev ? { ...prev, language: next } : prev));
    } finally {
      setIsSavingLanguage(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        retry: () => setAttempt((a) => a + 1),
        chooseLanguage,
        isSavingLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
