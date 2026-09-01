export type AuthStatus = "anonymous" | "authenticating" | "authenticated";

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: CurrentUser;
}

export interface AuthBridge {
  getAccessToken: () => string | undefined;
  getCurrentUser: () => CurrentUser | undefined;
  logout: () => void;
}

export interface MicroAppMeta {
  name: string;
  title: string;
  activeRule: string;
  basename: string;
  port: number;
}

export interface MicroAppProps extends AuthBridge {
  appName: string;
  basename: string;
  apiBaseUrl: string;
  container?: HTMLElement;
}

export const ADMIN_APP_ROUTE = "/app/admin";
export const ADMIN_APP_BASENAME = ADMIN_APP_ROUTE;
export const DEFAULT_API_BASE_URL = "/api";
export const DEFAULT_ADMIN_APP_ENTRY = "//127.0.0.1:7201/";

export const adminAppMeta = {
  name: "admin",
  title: "Admin",
  activeRule: ADMIN_APP_ROUTE,
  basename: ADMIN_APP_BASENAME,
  port: 7201
} as const satisfies MicroAppMeta;

export const microAppMetas = [adminAppMeta] as const satisfies readonly MicroAppMeta[];

export type ClassValue = string | number | false | null | undefined | Record<string, boolean>;

export function classNames(...values: ClassValue[]) {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (typeof value === "string" || typeof value === "number") {
      classes.push(String(value));
      continue;
    }

    for (const [className, enabled] of Object.entries(value)) {
      if (enabled) {
        classes.push(className);
      }
    }
  }

  return classes.join(" ");
}

export const cx = classNames;

export function matchesActiveRoute(activeRule: string, pathname: string) {
  const normalizedRule = stripTrailingSlashes(activeRule || "/");
  const normalizedPath = stripTrailingSlashes(pathname || "/");

  if (normalizedRule === "/") {
    return normalizedPath === "/";
  }

  return normalizedPath === normalizedRule || normalizedPath.startsWith(normalizedRule + "/");
}

function stripTrailingSlashes(value: string) {
  let normalized = value;

  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}
