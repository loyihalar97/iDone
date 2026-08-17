import { config } from "../../core/config";

/**
 * Hisobot davrlarini hisoblash (mahalliy vaqt bo'yicha).
 *
 * O'zbekistonda yozgi vaqt yo'q — UTC+5 doimiy. Shuning uchun kutubxonasiz,
 * oddiy siljish (offset) bilan ishlaymiz: "local" Date obyektining UTC
 * getterlari mahalliy devor soatini ko'rsatadi.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type ReportType = "weekly" | "monthly";

export interface ReportPeriod {
  type: ReportType;
  /** Takroriy yuborilmasligi uchun davr kaliti, masalan "weekly-2026-08-10". */
  key: string;
  /** Davr boshi (UTC, inklyuziv). */
  start: Date;
  /** Davr oxiri (UTC, inklyuziv — repository `lte` ishlatadi). */
  end: Date;
  /** Hisobot yuborilishi kerak bo'lgan lahza (UTC). */
  triggerAt: Date;
  /** Foydalanuvchiga ko'rsatiladigan davr matni, masalan "10.08.2026 – 16.08.2026". */
  label: string;
}

const offsetMs = () => config.reportTzOffsetMinutes * MINUTE;

/** UTC → mahalliy "devor soati" ko'rinishidagi Date. */
export function toLocal(d: Date): Date {
  return new Date(d.getTime() + offsetMs());
}

/** Mahalliy "devor soati" ko'rinishidagi Date → haqiqiy UTC. */
export function fromLocal(local: Date): Date {
  return new Date(local.getTime() - offsetMs());
}

function localMidnight(local: Date): Date {
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 0, 0, 0, 0)
  );
}

function makeLocal(y: number, m: number, d: number, h = 0): Date {
  return new Date(Date.UTC(y, m, d, h, 0, 0, 0));
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatLocalDate(local: Date): string {
  return `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()}`;
}

function isoDate(local: Date): string {
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
}

const MONTH_NAMES_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

/**
 * Oxirgi o'tib ketgan HAFTALIK hisobot davri.
 * Trigger: dushanba kuni `REPORT_WEEKLY_HOUR` (standart 07:00).
 * Davr: o'tgan hafta — dushanba 00:00 dan yakshanba 23:59:59 gacha.
 */
export function resolveWeeklyPeriod(now: Date = new Date()): ReportPeriod {
  const nowLocal = toLocal(now);
  const dayOfWeek = nowLocal.getUTCDay(); // 0 = yakshanba
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const thisMondayMidnight = new Date(localMidnight(nowLocal).getTime() - daysSinceMonday * DAY);
  let triggerLocal = new Date(thisMondayMidnight.getTime() + config.reportWeeklyHour * HOUR);

  // Bu haftaning triggeri hali kelmagan bo'lsa — o'tgan haftanikini olamiz.
  if (nowLocal.getTime() < triggerLocal.getTime()) {
    triggerLocal = new Date(triggerLocal.getTime() - 7 * DAY);
  }

  // Hisobot triggerdan oldingi to'liq haftani qamraydi.
  const weekEndLocal = new Date(triggerLocal.getTime() - config.reportWeeklyHour * HOUR); // dushanba 00:00
  const weekStartLocal = new Date(weekEndLocal.getTime() - 7 * DAY);

  return {
    type: "weekly",
    key: `weekly-${isoDate(weekStartLocal)}`,
    start: fromLocal(weekStartLocal),
    end: new Date(fromLocal(weekEndLocal).getTime() - 1), // yakshanba 23:59:59.999
    triggerAt: fromLocal(triggerLocal),
    label: `${formatLocalDate(weekStartLocal)} – ${formatLocalDate(
      new Date(weekEndLocal.getTime() - DAY)
    )}`,
  };
}

/**
 * Oxirgi o'tib ketgan OYLIK hisobot davri.
 * Trigger: oyning OXIRGI kuni `REPORT_MONTHLY_HOUR` (standart 16:00).
 * Davr: o'sha oyning 1-sanasidan trigger lahzasigacha.
 */
export function resolveMonthlyPeriod(now: Date = new Date()): ReportPeriod {
  const nowLocal = toLocal(now);
  let year = nowLocal.getUTCFullYear();
  let month = nowLocal.getUTCMonth();

  // Joriy oyning oxirgi kuni: keyingi oyning 0-kuni.
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let triggerLocal = makeLocal(year, month, lastDayOfMonth, config.reportMonthlyHour);

  // Joriy oyning triggeri hali kelmagan bo'lsa — o'tgan oynikini olamiz.
  if (nowLocal.getTime() < triggerLocal.getTime()) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    const prevLastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    triggerLocal = makeLocal(year, month, prevLastDay, config.reportMonthlyHour);
  }

  const monthStartLocal = makeLocal(year, month, 1);

  return {
    type: "monthly",
    key: `monthly-${year}-${pad(month + 1)}`,
    start: fromLocal(monthStartLocal),
    end: new Date(fromLocal(triggerLocal).getTime() - 1),
    triggerAt: fromLocal(triggerLocal),
    label: `${MONTH_NAMES_UZ[month]} ${year} (${formatLocalDate(
      monthStartLocal
    )} – ${formatLocalDate(triggerLocal)} ${pad(config.reportMonthlyHour)}:00)`,
  };
}

export function resolvePeriod(type: ReportType, now: Date = new Date()): ReportPeriod {
  return type === "weekly" ? resolveWeeklyPeriod(now) : resolveMonthlyPeriod(now);
}
