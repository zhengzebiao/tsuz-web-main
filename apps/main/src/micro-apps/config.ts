import {
  DEFAULT_API_BASE_URL,
  DEFAULT_MFE_APP_ENTRY,
  matchesActiveRoute,
  microAppMetas,
  type AuthBridge,
  type MicroAppMeta,
  type MicroAppProps
} from "@tsuz/shared";

export type { AuthBridge, MicroAppMeta, MicroAppProps } from "@tsuz/shared";

export interface MicroAppRegistration {
  name: string;
  entry: string;
  container: string;
  activeRule: (location: Location) => boolean;
  props: MicroAppProps;
}

export type MicroAppEnvironment = Partial<Record<"VITE_API_BASE_URL" | "VITE_MFE_APP_ENTRY", string | undefined>>;

export interface CreateMicroAppsOptions {
  env?: MicroAppEnvironment;
  hostname?: string;
  containerSelector?: string;
  isAuthenticated?: () => boolean;
  isContainerReady?: () => boolean;
}

export function resolveApiBaseUrl(env: MicroAppEnvironment = readViteEnvironment()) {
  return env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}

export function resolveMicroAppEntry(
  meta: MicroAppMeta = microAppMetas[0],
  env: MicroAppEnvironment = readViteEnvironment(),
  hostname = getDefaultHostname()
) {
  return env.VITE_MFE_APP_ENTRY?.trim() || (hostname ? "//" + hostname + ":" + meta.port : DEFAULT_MFE_APP_ENTRY);
}

export { matchesActiveRoute };

export function createMicroApps(authBridge: AuthBridge, options: CreateMicroAppsOptions = {}): MicroAppRegistration[] {
  const env = options.env ?? readViteEnvironment();
  const hostname = options.hostname ?? getDefaultHostname();
  const containerSelector = options.containerSelector ?? "#subapp-container";
  const apiBaseUrl = resolveApiBaseUrl(env);

  return microAppMetas.map((meta) => ({
    name: meta.name,
    entry: resolveMicroAppEntry(meta, env, hostname),
    container: containerSelector,
    activeRule: (location) =>
      isAuthenticated(authBridge, options) &&
      isContainerReady(containerSelector, options) &&
      matchesActiveRoute(meta.activeRule, location.pathname),
    props: {
      appName: meta.name,
      basename: meta.basename,
      apiBaseUrl,
      getAccessToken: authBridge.getAccessToken,
      getCurrentUser: authBridge.getCurrentUser,
      logout: authBridge.logout
    }
  }));
}

function isAuthenticated(authBridge: AuthBridge, options: CreateMicroAppsOptions) {
  return options.isAuthenticated?.() ?? Boolean(authBridge.getAccessToken());
}

function isContainerReady(containerSelector: string, options: CreateMicroAppsOptions) {
  return options.isContainerReady?.() ?? hasMicroAppContainer(containerSelector);
}

function hasMicroAppContainer(containerSelector: string) {
  return typeof document !== "undefined" && document.querySelector(containerSelector) !== null;
}

function readViteEnvironment(): MicroAppEnvironment {
  return import.meta.env;
}

function getDefaultHostname() {
  return globalThis.location?.hostname || "localhost";
}
