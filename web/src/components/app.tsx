import React, { useSyncExternalStore } from "react";
import { App, SnackbarProvider, AppRouter } from "../ui";
import { Layout } from "./layout";
import { lang, subscribeLang } from "../i18n";

/** Đổi ngôn ngữ thì vẽ lại toàn bộ (key theo ngôn ngữ), mọi câu tr() lấy theo ngôn ngữ mới */
const MyApp = () => {
  const l = useSyncExternalStore(subscribeLang, lang, lang);
  return (
    <App>
      <SnackbarProvider>
        <AppRouter>
          <Layout key={l} />
        </AppRouter>
      </SnackbarProvider>
    </App>
  );
};

export default MyApp;
