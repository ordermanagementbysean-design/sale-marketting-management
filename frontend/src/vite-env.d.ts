/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sent as `X-Company-Id` for `/api/orders` (Laravel RequireCompanyId). */
  readonly VITE_COMPANY_ID?: string;
}
