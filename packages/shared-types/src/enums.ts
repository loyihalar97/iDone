/**
 * Tizim tillari / Языки системы.
 *
 * Foydalanuvchi tilni o'zi tanlaydi (Mini App sarlavhasidagi UZ/RU tugmasi
 * orqali). Tanlangan til `users.language` ustunida saqlanadi va butun
 * interfeys, Telegram bildirishnomalari hamda PDF/Excel hisobotlar
 * o'sha tilda chiqadi.
 */
export enum Language {
  UZ = "uz",
  RU = "ru",
}

/** Tanlash mumkin bo'lgan tillar ro'yxati (tartibi bilan). */
export const LANGUAGES: Language[] = [Language.UZ, Language.RU];

/** Til tanlash tugmalarida ko'rsatiladigan nomlar (har doim o'z tilida). */
export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.UZ]: "O'zbekcha",
  [Language.RU]: "Русский",
};

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  [Language.UZ]: "UZ",
  [Language.RU]: "RU",
};

/** Noma'lum qiymatni xavfsiz `Language`ga aylantiradi (standart — o'zbekcha). */
export function normalizeLanguage(value: unknown, fallback: Language = Language.UZ): Language {
  if (typeof value !== "string") return fallback;
  const v = value.trim().toLowerCase();
  if (v === Language.RU || v.startsWith("ru")) return Language.RU;
  if (v === Language.UZ || v.startsWith("uz")) return Language.UZ;
  return fallback;
}

/** Sana/son formatlash uchun locale kodlari. */
export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  [Language.UZ]: "uz-UZ",
  [Language.RU]: "ru-RU",
};

export enum Role {
  DIRECTOR = "director",
  CHIEF_TECHNICIAN = "chief_technician",
  TECHNICIAN = "technician",
  SUPERADMIN = "superadmin",
  /** Hududiy rahbar — o'ziga biriktirilgan bir nechta filialni boshqaradi. */
  REGIONAL_MANAGER = "regional_manager",
  /** Rahbar — butun kompaniyani (barcha filiallar + texniklar) kuzatadi. */
  EXECUTIVE = "executive",
  /** Filial menejeri — faqat o'z filiali doirasida ishlaydi. */
  BRANCH_MANAGER = "branch_manager",
}

export const ROLE_LABELS_UZ: Record<Role, string> = {
  [Role.DIRECTOR]: "Filial direktori",
  [Role.CHIEF_TECHNICIAN]: "Bosh texnik",
  [Role.TECHNICIAN]: "Texnik",
  [Role.SUPERADMIN]: "Superadmin",
  [Role.REGIONAL_MANAGER]: "Hududiy rahbar",
  [Role.EXECUTIVE]: "Rahbar",
  [Role.BRANCH_MANAGER]: "Filial menejeri",
};

export const ROLE_LABELS_RU: Record<Role, string> = {
  [Role.DIRECTOR]: "Директор филиала",
  [Role.CHIEF_TECHNICIAN]: "Главный техник",
  [Role.TECHNICIAN]: "Техник",
  [Role.SUPERADMIN]: "Суперадмин",
  [Role.REGIONAL_MANAGER]: "Региональный руководитель",
  [Role.EXECUTIVE]: "Руководитель",
  [Role.BRANCH_MANAGER]: "Менеджер филиала",
};

export const ROLE_LABELS: Record<Language, Record<Role, string>> = {
  [Language.UZ]: ROLE_LABELS_UZ,
  [Language.RU]: ROLE_LABELS_RU,
};

/** Barcha filiallarni cheklovsiz ko'radigan rollar. */
export const GLOBAL_SCOPE_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.CHIEF_TECHNICIAN,
  Role.EXECUTIVE,
];

/** Zayavka ocha oladigan rollar. */
export const REQUEST_CREATOR_ROLES: Role[] = [
  Role.DIRECTOR,
  Role.BRANCH_MANAGER,
  Role.REGIONAL_MANAGER,
  Role.EXECUTIVE,
  Role.SUPERADMIN,
];

export enum RequestStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  COMPLETED_BY_TECHNICIAN = "completed_by_technician",
  APPROVED_BY_CHIEF_TECHNICIAN = "approved_by_chief_technician",
  ACCEPTED_BY_DIRECTOR = "accepted_by_director",
  CLOSED = "closed",
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum Category {
  ELECTRICAL = "electrical",
  PLUMBING = "plumbing",
  AC = "ac",
  KITCHEN_EQUIPMENT = "kitchen_equipment",
  IT_EQUIPMENT = "it_equipment",
  FURNITURE = "furniture",
  OTHER = "other",
}

export const CATEGORY_LABELS_UZ: Record<Category, string> = {
  [Category.ELECTRICAL]: "Elektr ishlari",
  [Category.PLUMBING]: "Santexnika",
  [Category.AC]: "Konditsioner",
  [Category.KITCHEN_EQUIPMENT]: "Oshxona uskunalari",
  [Category.IT_EQUIPMENT]: "IT uskunalari",
  [Category.FURNITURE]: "Mebel",
  [Category.OTHER]: "Boshqa",
};

export const CATEGORY_LABELS_RU: Record<Category, string> = {
  [Category.ELECTRICAL]: "Электрика",
  [Category.PLUMBING]: "Сантехника",
  [Category.AC]: "Кондиционер",
  [Category.KITCHEN_EQUIPMENT]: "Кухонное оборудование",
  [Category.IT_EQUIPMENT]: "IT-оборудование",
  [Category.FURNITURE]: "Мебель",
  [Category.OTHER]: "Другое",
};

export const CATEGORY_LABELS: Record<Language, Record<Category, string>> = {
  [Language.UZ]: CATEGORY_LABELS_UZ,
  [Language.RU]: CATEGORY_LABELS_RU,
};

export const PRIORITY_LABELS_UZ: Record<Priority, string> = {
  [Priority.LOW]: "Past",
  [Priority.MEDIUM]: "O'rta",
  [Priority.HIGH]: "Yuqori",
  [Priority.CRITICAL]: "Kritik",
};

export const PRIORITY_LABELS_RU: Record<Priority, string> = {
  [Priority.LOW]: "Низкий",
  [Priority.MEDIUM]: "Средний",
  [Priority.HIGH]: "Высокий",
  [Priority.CRITICAL]: "Критический",
};

export const PRIORITY_LABELS: Record<Language, Record<Priority, string>> = {
  [Language.UZ]: PRIORITY_LABELS_UZ,
  [Language.RU]: PRIORITY_LABELS_RU,
};

export const STATUS_LABELS_UZ: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "Yangi",
  [RequestStatus.IN_PROGRESS]: "Jarayonda",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "Texnik tugatdi",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "Bosh texnik tasdiqladi",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "Direktor tasdiqladi",
  [RequestStatus.CLOSED]: "Yopildi",
};

export const STATUS_LABELS_RU: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "Новая",
  [RequestStatus.IN_PROGRESS]: "В процессе",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "Техник завершил",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "Главный техник подтвердил",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "Директор подтвердил",
  [RequestStatus.CLOSED]: "Закрыта",
};

export const STATUS_LABELS: Record<Language, Record<RequestStatus, string>> = {
  [Language.UZ]: STATUS_LABELS_UZ,
  [Language.RU]: STATUS_LABELS_RU,
};

/** Lavozim nomi tanlangan tilda (noma'lum qiymat o'zi qaytariladi). */
export function roleLabel(role: Role | string, lang: Language): string {
  return ROLE_LABELS[lang][role as Role] ?? String(role);
}

/** Holat nomi tanlangan tilda. */
export function statusLabel(status: RequestStatus | string, lang: Language): string {
  return STATUS_LABELS[lang][status as RequestStatus] ?? String(status);
}

/** Muhimlik darajasi nomi tanlangan tilda. */
export function priorityLabel(priority: Priority | string, lang: Language): string {
  return PRIORITY_LABELS[lang][priority as Priority] ?? String(priority);
}

/** Standart kategoriya nomi tanlangan tilda (DB'dagi kategoriyalar uchun emas). */
export function categoryLabel(category: Category | string, lang: Language): string {
  return CATEGORY_LABELS[lang][category as Category] ?? String(category);
}

export enum NotificationType {
  REQUEST_CREATED = "request_created",
  TECHNICIAN_ASSIGNED = "technician_assigned",
  TECHNICIAN_STARTED = "technician_started",
  TECHNICIAN_COMPLETED = "technician_completed",
  CHIEF_APPROVED = "chief_approved",
  REQUEST_CLOSED = "request_closed",
  /** Bosh texnik zayavkaga izoh yozdi (masalan: bajarish imkonsiz sabablari). */
  REQUEST_COMMENT = "request_comment",
  /** Zayavkaning muhimlik darajasi o'zgartirildi. */
  PRIORITY_CHANGED = "priority_changed",
}
