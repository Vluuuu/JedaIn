export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  enableEmailAuth: import.meta.env.VITE_ENABLE_EMAIL_AUTH === "true",
} as const;
