import { createApiClient } from "@tsuz/api";
import { DEFAULT_API_BASE_URL } from "@tsuz/shared";
import { authBridge } from "../stores/auth.store";

export function createMainApiClient(baseUrl = DEFAULT_API_BASE_URL) {
  return createApiClient({
    baseUrl,
    getAccessToken: authBridge.getAccessToken,
    onUnauthorized: () => authBridge.logout()
  });
}
