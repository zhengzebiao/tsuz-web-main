import { registerMicroApps, start } from "qiankun";
import { authBridge, useAuthStore } from "../stores/auth.store";
import { createMicroApps } from "./config";

let registered = false;

export function registerMicroFrontendApps() {
  if (registered) {
    return;
  }

  registerMicroApps(
    createMicroApps(authBridge, {
      isAuthenticated: () => useAuthStore.getState().status === "authenticated",
      isContainerReady: () => document.querySelector("#subapp-container") !== null
    })
  );
  start({ prefetch: false });
  registered = true;
}
