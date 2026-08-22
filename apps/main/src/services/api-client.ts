import { createApiClient, type ApiClient } from "@tsuz/api";
import { resolveApiBaseUrl } from "../micro-apps/config";
import { authSessionStorage } from "./auth-session";

export interface MainApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  fetcher?: typeof fetch;
  refreshAccessToken?: () => void | Promise<void>;
  onUnauthorized?: (response: Response) => void | Promise<void>;
}

export function createMainApiClient(options: MainApiClientOptions = {}): ApiClient {
  return createApiClient({
    baseUrl: options.baseUrl ?? resolveApiBaseUrl(),
    getAccessToken: options.getAccessToken ?? (() => authSessionStorage.read()?.accessToken),
    refreshAccessToken: options.refreshAccessToken,
    onUnauthorized: options.onUnauthorized ?? (() => authSessionStorage.clear()),
    fetcher: options.fetcher
  });
}
