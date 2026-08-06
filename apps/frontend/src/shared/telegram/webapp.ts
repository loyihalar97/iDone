export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
    setText: (text: string) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    disable: () => void;
    enable: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  showAlert: (message: string) => void;
  showConfirm: (message: string, cb: (ok: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

const isTelegramEnv = typeof window !== "undefined" && !!window.Telegram?.WebApp;

/**
 * Telegram tashqarisida (oddiy brauzerda) ham ishlab turishi uchun
 * mock obyekt qaytaramiz — bu lokal development'ni osonlashtiradi.
 */
function createMockWebApp(): TelegramWebApp {
  return {
    initData: "",
    initDataUnsafe: {},
    colorScheme: "light",
    themeParams: {},
    ready: () => {},
    expand: () => {},
    close: () => {},
    MainButton: {
      text: "",
      show: () => {},
      hide: () => {},
      onClick: () => {},
      offClick: () => {},
      setText: () => {},
      showProgress: () => {},
      hideProgress: () => {},
      disable: () => {},
      enable: () => {},
    },
    BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
    HapticFeedback: { impactOccurred: () => {}, notificationOccurred: () => {} },
    showAlert: (msg) => alert(msg),
    showConfirm: (msg, cb) => cb(confirm(msg)),
  };
}

export const telegram: TelegramWebApp = isTelegramEnv ? window.Telegram!.WebApp : createMockWebApp();

export function initTelegram() {
  telegram.ready();
  telegram.expand();
}

export function getInitData(): string {
  return telegram.initData;
}
