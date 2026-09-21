/**
 * O'zbekcha matnlar — barcha interfeys satrlarining ASOSIY manbasi.
 *
 * Ruscha tarjima (`ru.ts`) shu obyektning tipiga bo'ysunadi: yangi kalit
 * qo'shsangiz, ruschasini ham qo'shmaguningizcha TypeScript xato beradi.
 * Shu tufayli interfeys hech qachon "yarim tarjima" holatda qolmaydi.
 */
export const uz = {
  common: {
    loading: "Yuklanmoqda...",
    sending: "Yuborilmoqda...",
    save: "Saqlash",
    cancel: "Bekor",
    add: "Qo'shish",
    edit: "Tahrir",
    delete: "O'chir",
    deleteFull: "O'chirish",
    active: "Faol",
    inactive: "Faol emas",
    makeActive: "Faol",
    makeInactive: "Nofaol",
    ready: "Tayyor",
    error: "Xatolik yuz berdi",
    retry: "Qayta urinish",
    all: "Barchasi",
    currency: "so'm",
    optional: "ixtiyoriy",
    required: "majburiy",
    notSaved: "Saqlab bo'lmadi",
    notDeleted: "O'chirib bo'lmadi",
    notAdded: "Qo'shib bo'lmadi",
  },

  language: {
    /** Birinchi kirishdagi til tanlash oynasi. */
    chooseTitle: "Tilni tanlang",
    chooseSubtitle: "Ilova, bildirishnomalar va hisobotlar shu tilda bo'ladi",
    switchTitle: "Til",
    saving: "Saqlanmoqda...",
    changeError: "Tilni o'zgartirib bo'lmadi",
  },

  auth: {
    signingIn: "Kirilmoqda...",
    signInError: "Kirishda xatolik",
    initDataMissing:
      "Telegram initData topilmadi. Ilovani Telegram ichidan ochganingizga ishonch hosil qiling.",
    genericError: "Tizimga kirishda xatolik yuz berdi",
  },

  appTitle: "Texnik Xizmat",

  titles: {
    directorRequests: "Ochiq zayavkalar",
    directorClosed: "Tugatilgan zayavkalar",
    stats: "Statistika",
    newRequest: "Yangi zayavka",
    chiefRequests: "Barcha zayavkalar",
    chiefTechnicians: "Texniklar nazorati",
    technicianOpen: "Ochiq ishlar",
    technicianClosed: "Tugatilgan ishlar",
    managerRequests: "Ochiq zayavkalar",
    managerClosed: "Tarix va hisobotlar",
    superadminRequests: "Barcha zayavkalar",
    users: "Foydalanuvchilar",
    branches: "Filiallar",
    categories: "Kategoriyalar",
    requestDetails: "Zayavka tafsilotlari",
  },

  nav: {
    open: "Ochiq",
    done: "Tugagan",
    new: "Yangi",
    stats: "Statistika",
    requests: "Zayavkalar",
    technicians: "Texniklar",
    staff: "Xodimlar",
    branches: "Filiallar",
    categories: "Kategoriya",
    history: "Tarix",
  },

  request: {
    emptyOpenTitle: "Ochiq zayavkalar yo'q",
    emptyOpenSubtitleDirector:
      "Yangi texnik muammo bo'lsa, pastdagi tugma orqali zayavka yarating",
    emptyOpenSubtitleManager: "Filtrlarni o'zgartirib ko'ring yoki yangi zayavka oching",
    emptyClosedTitle: "Tugatilgan zayavkalar yo'q",
    emptyClosedSubtitle: "Yopilgan zayavkalar shu yerda ko'rinadi",
    emptyNotFound: "Zayavkalar topilmadi",
    emptyChangeFilters: "Filtrlarni o'zgartirib ko'ring",
    hasComment: "Izoh bor",
    newRequestButton: "Yangi zayavka",
    deleteConfirm: (branch: string) =>
      `"${branch}" zayavkasini butunlay o'chirasizmi? Bu amalni ortga qaytarib bo'lmaydi.`,
  },

  time: {
    justNow: "hozir",
    minutesAgo: (n: number) => `${n} daqiqa oldin`,
    hoursAgo: (n: number) => `${n} soat oldin`,
    yesterday: "kecha",
    daysAgo: (n: number) => `${n} kun oldin`,
  },

  filters: {
    more: "Qo'shimcha filtrlar",
    allStatuses: "Barcha statuslar",
    allBranches: "Barcha filiallar",
    allPriorities: "Barcha darajalar",
    allTechnicians: "Barcha texniklar",
    allCreators: "Barcha yaratuvchilar",
    allRoles: "Barcha lavozimlar",
  },

  newRequest: {
    branch: "Filial",
    branchNotFound: "Filial topilmadi",
    category: "Muammo kategoriyasi",
    description: "Muammo tavsifi",
    descriptionPlaceholder: "Muammoni batafsil yozing...",
    priority: "Muhimlik darajasi",
    photo: "Muammo rasmi (majburiy)",
    pickFile: "Rasm yoki video tanlang",
    preview: "Oldindan ko'rish",
    submit: "Yuborish",
    photoRequired: "Muammo rasmi majburiy",
    noBranchTitle: "Sizga filial biriktirilmagan",
    noBranchSubtitle:
      "Zayavka ochish uchun Superadmin sizga filial biriktirishi kerak. Administratorga murojaat qiling.",
    noBranchesTitle: "Sizga filiallar biriktirilmagan",
    noBranchesSubtitle:
      "Hududingizdagi filiallarni Superadmin biriktirishi kerak. Administratorga murojaat qiling.",
  },

  detail: {
    problemPhoto: "Muammo",
    resultPhoto: "Natija rasmi",
    result: "Natija",
    createdBy: "Yaratdi",
    openedAt: "Ochilgan sanasi",
    closedAt: "Yopilgan sanasi",
    chiefTechnician: "Bosh texnik",
    technician: "Texnik",
    expense: "Harajat",
    blockersTitle: "Bajarish imkonsizligi sabablari",
    changePriority: "Muhimlik darajasini o'zgartirish",
    assignTechnician: "Texnikni biriktirish",
    changeTechnician: "Texnikni o'zgartirish",
    pickTechnician: "Texnikni tanlang",
    self: " (o'zim)",
    chiefSuffix: " (bosh texnik)",
    assign: "Biriktirish",
    change: "O'zgartirish",
    commentTitle: "Bu ishni bajarish imkonsiz (izoh)",
    commentPlaceholder: "Sababini yozing — filial direktoriga xabar bo'lib boradi...",
    commentHint:
      "Texnik biriktirilmaydi, zayavka holati o'zgarmaydi. Izoh filial direktorining bot chatiga yuboriladi.",
    sendComment: "Izohni yuborish",
    startWork: "Ishni boshlash",
    resultPhotoRequired: "Natija rasmi (majburiy)",
    resultPhotoMissing: "Natija rasmi majburiy",
    technicianExpense: "Ishlatilgan harajat (ixtiyoriy)",
    expensePlaceholder: "Masalan: 150000",
    expenseAutoZero: "Bo'sh qoldirsangiz harajat avtomatik 0 deb yoziladi.",
    finishWork: "Ishni yakunlash",
    chiefExpense: "Harajat summasi (ixtiyoriy — tahrirlash)",
    chiefExpenseHint:
      "Texnik kiritgan summa ko'rsatilgan. O'zgartirish shart emas — shundayligicha yakunlashingiz mumkin.",
    acceptAndClose: "Qabul qilish (zayavka yopiladi)",
    invalidExpense: "Harajat summasi noto'g'ri kiritilgan",
  },

  export: {
    pdf: "PDF eksport",
    excel: "Excel eksport",
    success: (count: number, format: string) =>
      `✅ ${count} ta zayavka ${format} faylga eksport qilindi va bot chatingizga yuborildi.`,
    failed: "Eksport qilib bo'lmadi",
  },

  chief: {
    sortHint: "Zayavkalarni tutqichdan ushlab sudrang — ish ketma-ketligi avtomatik saqlanadi.",
    sortButton: "Ish ketma-ketligini tartiblash",
    sortEmpty: "Tartiblash uchun ochiq zayavka yo'q",
    sortHandle: "Sudrab tartiblash",
    sortFailed: "Tartibni saqlab bo'lmadi. Qayta urinib ko'ring.",
  },

  technicians: {
    emptyTitle: "Texniklar yo'q",
    emptySubtitle: "Superadmin texnik rolini tayinlaganda shu yerda ko'rinadi",
    allBranches: "Barcha filiallar",
    new: "Yangi",
    inProgress: "Jarayonda",
    completed: "Yakunlagan",
    closed: "Yopilgan",
    free: "Hozir bo'sh — yangi ish biriktirish mumkin",
    myEmptyTitle: "Sizga biriktirilgan ochiq ish yo'q",
    myEmptySubtitle: "Bosh texnik yangi ish biriktirganda shu yerda ko'rinadi",
    myClosedTitle: "Tugatilgan ish yo'q",
    myClosedSubtitle: "Siz yakunlagan ishlar shu yerda ko'rinadi",
  },

  dashboard: {
    loading: "Statistika yuklanmoqda...",
    openRequests: "Ochiq zayavkalar",
    inProgress: "Jarayonda",
    closedToday: "Bugun yopilgan",
    closedThisMonth: "Oy davomida yopilgan",
    hours: "soat",
    avgResolution: "O'rtacha bajarilish vaqti",
    topBranches: "Eng ko'p muammo kelayotgan filiallar",
    busiestTechnicians: "Eng band texniklar",
  },

  broadcast: {
    title: "Barchaga xabar yuborish",
    hint: "Xabar botdan foydalanadigan barcha faol xodimlarning shaxsiy chatiga bir vaqtda yuboriladi.",
    placeholder: "Xabar matnini kiriting...",
    send: "Yuborish",
    sending: "Yuborilmoqda...",
    confirm: "Xabar barcha faol foydalanuvchilarga yuborilsinmi? Bu amalni bekor qilib bo'lmaydi.",
    result: (sent: number, failed: number) =>
      failed > 0
        ? `Yuborildi: ${sent} ta. Yuborilmadi: ${failed} ta (bot bloklangan yoki /start bosilmagan).`
        : `Xabar ${sent} ta foydalanuvchiga muvaffaqiyatli yuborildi.`,
    emptyText: "Avval xabar matnini kiriting",
    noRecipients: "Yuborish uchun faol foydalanuvchi topilmadi",
  },

  branches: {
    addTitle: "Yangi filial qo'shish",
    namePlaceholder: "Filial nomi",
    addressPlaceholder: "Manzil (ixtiyoriy)",
    swipeHint: "Tahrirlash, faollik yoki o'chirish uchun kartani chapga suring.",
    editTitle: "Filialni tahrirlash",
    deleteConfirm: (name: string) => `"${name}" filialini o'chirasizmi?`,
  },

  categories: {
    addTitle: "Yangi kategoriya (topshiriq turi)",
    nameUz: "Nomi (o'zbekcha)",
    nameRu: "Nomi (ruscha)",
    nameUzPlaceholder: "Masalan: Chiroq almashtirish",
    nameRuPlaceholder: "Например: Замена лампы",
    hint:
      "Bu ro'yxat zayavka yaratishda tanlanadi. Har bir kategoriyaning o'zbekcha va ruscha nomini kiriting — " +
      "foydalanuvchi tanlagan tilga qarab mos nomi ko'rsatiladi. Tahrirlash, faollik yoki o'chirish uchun " +
      "kartani chapga suring. Ishlatilayotgan kategoriyani o'chirib bo'lmaydi — uni faolsizlantiring.",
    editTitle: "Kategoriyani tahrirlash",
    missingRu: "Ruscha nomi yo'q",
    deleteConfirm: (name: string) => `"${name}" kategoriyasini o'chirasizmi?`,
  },

  users: {
    emptyTitle: "Foydalanuvchilar yo'q",
    emptySubtitle: "Botga /start bosgan foydalanuvchilar shu yerda ko'rinadi",
    hint:
      "Yangi foydalanuvchi botga /start bosganda ro'yxatga avtomatik qo'shiladi, lekin superadmin rol " +
      "tayinlab faollashtirmaguncha tizimga kira olmaydi. Tahrirlash, faollik yoki o'chirish uchun kartani " +
      "chapga suring.",
    noName: "Ism ko'rsatilmagan",
    noBranches: "Filiallar biriktirilmagan",
    allBranches: "Barcha filiallar",
    pickBranch: "Filial tanlang",
    multiBranchLabel: "Biriktiriladigan filiallar (kamida bitta)",
    addBranchFirst: 'Avval "Filiallar" bo\'limida filial qo\'shing.',
    selectedCount: (n: number) => `Tanlangan: ${n} ta filial`,
    deleteConfirm: (name: string) =>
      `"${name}" xodimini butunlay o'chirasizmi?\n\n` +
      `Uning yaratgan zayavkalari administratorga o'tkaziladi, biriktirilgan ishlari bo'shatiladi. ` +
      `Bu amalni ortga qaytarib bo'lmaydi.`,
  },
};

/** Barcha tillar shu tipga bo'ysunadi — tarjima to'liqligi kafolatlanadi. */
export type Dictionary = typeof uz;
