import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app/App";
import { AuthProvider } from "./shared/hooks/useAuth";
import { I18nProvider } from "./shared/i18n";
import { initTelegram } from "./shared/telegram/webapp";
import "./index.css";

initTelegram();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* I18nProvider AuthProvider'dan tashqarida — chunki kirish
          xabarlari ham tanlangan tilda ko'rsatiladi. */}
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
