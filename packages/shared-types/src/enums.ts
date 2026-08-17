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

export const PRIORITY_LABELS_UZ: Record<Priority, string> = {
  [Priority.LOW]: "Past",
  [Priority.MEDIUM]: "O'rta",
  [Priority.HIGH]: "Yuqori",
  [Priority.CRITICAL]: "Kritik",
};

export const STATUS_LABELS_UZ: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: "Yangi",
  [RequestStatus.IN_PROGRESS]: "Jarayonda",
  [RequestStatus.COMPLETED_BY_TECHNICIAN]: "Texnik tugatdi",
  [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "Bosh texnik tasdiqladi",
  [RequestStatus.ACCEPTED_BY_DIRECTOR]: "Direktor tasdiqladi",
  [RequestStatus.CLOSED]: "Yopildi",
};

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
