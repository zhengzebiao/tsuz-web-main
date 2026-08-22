import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";
import { registerMicroFrontendApps } from "./micro-apps/registry";
import { restoreAuthSession } from "./stores/auth.store";
import "./styles/main.css";

void restoreAuthSession();
registerMicroFrontendApps();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
