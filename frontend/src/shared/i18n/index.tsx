import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Category,
  Language,
  LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_SHORT_LABELS,
  normalizeLanguage,
  Priority,
  priorityLabel,
  RequestStatus,
  Role,
  roleLabel,
  statusLabel,
  categoryLabel,
} from "@app/shared-types";
import { Dictionary, uz } from "./uz";
import { ru } from "./ru";
import { setApiLanguage } from "../api/client";
import { telegram } from "../telegram/webapp";

export { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_SHORT_LABELS, Language };
export type { Dictionary };

const DICTIONARIES: Record<Language, Dictionary> = {
  [Language.UZ]: uz,
  [Language.RU]: ru,
};

const STORAGE_KEY = "app_language";

/** Brauzer xotirasidagi tanlov (sahifa yangilanganda ham saqlanadi). */
function readStoredLanguage(): Language | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeLanguage(raw);
  } catch {
    return null;
  }
}

function storeLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* Telegram ichida localStorage cheklangan bo'lishi mumkin — muhim emas. */
  }
}

/** Telegram ilovasining tili — birinchi kirishdagi taxmin uchun. */
function telegramLanguage(): Language | null {
  const user = (telegram.initDataUnsafe as { user?: { language_code?: string } })?.user;
  return user?.language_code ? normalizeLanguage(user.language_code) : null;
}

/** Ilova ochilganda boshlang'ich til: saqlangan tanlov → Telegram tili → o'zbekcha. */
function initialLanguage(): Language {
  return readStoredLanguage() ?? telegramLanguage() ?? Language.UZ;
}

interface I18nContextValue {
  lang: Language;
  /** Joriy tildagi barcha interfeys matnlari. */
  t: Dictionary;
  /** Tilni almashtiradi (serverga saqlash `useAuth` orqali amalga oshadi). */
  setLang: (lang: Language) => void;
  /** Holat/muhimlik/lavozim nomlari joriy tilda. */
  statusText: (status: RequestStatus | string) => string;
  priorityText: (priority: Priority | string) => string;
  roleText: (role: Role | string) => string;
  categoryText: (category: Category | string) => string;
  /** Sana-vaqt joriy til formatida. */
  formatDateTime: (iso: string | Date) => string;
  /** Son (masalan harajat summasi) joriy til formatida. */
  formatNumber: (value: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [lang, setLangState] = useState<Language>(() => {
    const initial = initialLanguage();
    // API so'rovlari ham shu tilda javob qaytarishi uchun (X-Lang sarlavhasi).
    setApiLanguage(initial);
    return initial;
  });

  useEffect(() => {
    setApiLanguage(lang);
    storeLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    // DIQQAT: API tilini DARHOL (effect'ni kutmasdan) o'rnatamiz.
    // Til almashganda react-query keshi yangi kalit bilan qayta so'rov
    // yuboradi va bu so'rov render'dan keyingi effect'dan OLDIN ketishi
    // mumkin — o'shanda `X-Lang` eski tilda qolib, kategoriya nomlari
    // noto'g'ri tilda keshlanib qolardi.
    setApiLanguage(next);
    storeLanguage(next);
    setLangState(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const locale = lang === Language.RU ? "ru-RU" : "uz-UZ";
    return {
      lang,
      t: DICTIONARIES[lang],
      setLang,
      statusText: (status) => statusLabel(status, lang),
      priorityText: (priority) => priorityLabel(priority, lang),
      roleText: (role) => roleLabel(role, lang),
      categoryText: (category) => categoryLabel(category, lang),
      formatDateTime: (iso) =>
        new Date(iso).toLocaleString(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      formatNumber: (n) => n.toLocaleString(locale),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n I18nProvider ichida ishlatilishi kerak");
  return ctx;
}

/** Sana/son formatlash uchun locale kodi. */
export function localeOf(lang: Language): string {
  return lang === Language.RU ? "ru-RU" : "uz-UZ";
}
