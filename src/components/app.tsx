import React from "react";
import { App, SnackbarProvider, ZMPRouter } from "zmp-ui";
import { Layout } from "./layout";

const MyApp = () => (
  <App>
    <SnackbarProvider>
      <ZMPRouter>
        <Layout />
      </ZMPRouter>
    </SnackbarProvider>
  </App>
);

export default MyApp;
