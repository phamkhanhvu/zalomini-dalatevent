import React from "react";
import { App, SnackbarProvider, AppRouter } from "../ui";
import { Layout } from "./layout";

const MyApp = () => (
  <App>
    <SnackbarProvider>
      <AppRouter>
        <Layout />
      </AppRouter>
    </SnackbarProvider>
  </App>
);

export default MyApp;
