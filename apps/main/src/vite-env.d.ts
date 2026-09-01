/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ADMIN_APP_ENTRY?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_MAIN_WEB_SESSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
