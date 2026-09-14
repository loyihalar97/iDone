import { Languages } from "lucide-react";
import { Language, LANGUAGES, LANGUAGE_LABELS, LANGUAGE_SHORT_LABELS, useI18n } from "../i18n";
import { useAuth } from "../hooks/useAuth";

/**
 * Sarlavhadagi UZ/RU almashtirgichi — foydalanuvchi tilni istalgan paytda
 * o'zgartira oladi. Tanlov serverda saqlanadi, shuning uchun Telegram
 * bildirishnomalari va PDF/Excel hisobotlar ham shu tilda keladi.
 */
export function LanguageSwitch() {
  const { lang } = useI18n();
  const { chooseLanguage, isSavingLanguage } = useAuth();

  return (
    <div
      className="ml-auto flex items-center gap-0.5 bg-tg-secondaryBg border border-line rounded-pill p-0.5 flex-shrink-0"
      role="group"
      aria-label={LANGUAGE_LABELS[lang]}
    >
      {LANGUAGES.map((code) => {
        const isActive = code === lang;
        return (
          <button
            key={code}
            type="button"
            disabled={isSavingLanguage}
            onClick={() => !isActive && chooseLanguage(code)}
            aria-pressed={isActive}
            title={LANGUAGE_LABELS[code]}
            className={`px-2.5 py-1 rounded-pill text-[11px] font-extrabold transition disabled:opacity-60 ${
              isActive ? "bg-tg-text text-tg-bg" : "text-inkFaint active:opacity-60"
            }`}
          >
            {LANGUAGE_SHORT_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Birinchi kirishdagi to'liq ekranli til tanlash oynasi. Foydalanuvchi
 * tilni tanlamaguncha ilova ochilmaydi — shundan keyin uni sarlavhadagi
 * UZ/RU tugmasi orqali o'zgartirish mumkin.
 */
export function LanguagePicker() {
  const { t } = useI18n();
  const { chooseLanguage, isSavingLanguage } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
      <div className="w-14 h-14 rounded-2xl bg-accentSoft flex items-center justify-center text-accent">
        <Languages size={26} strokeWidth={1.75} />
      </div>

      <div className="text-center">
        <p className="text-tg-text font-extrabold text-[19px] tracking-tight2">
          {t.language.chooseTitle}
        </p>
        <p className="text-tg-hint text-[13px] mt-2 max-w-[260px] leading-relaxed">
          {t.language.chooseSubtitle}
        </p>
      </div>

      <div className="w-full max-w-[300px] space-y-2.5">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            disabled={isSavingLanguage}
            onClick={() => chooseLanguage(code)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-control border-[1.5px] border-lineStrong text-tg-text font-bold text-[15px] active:opacity-70 transition disabled:opacity-50"
          >
            {LANGUAGE_LABELS[code]}
            <span className="text-[11px] font-extrabold text-inkFaint">
              {LANGUAGE_SHORT_LABELS[code]}
            </span>
          </button>
        ))}
      </div>

      {isSavingLanguage && (
        <p className="text-tg-hint text-[12.5px]">{t.language.saving}</p>
      )}
    </div>
  );
}
