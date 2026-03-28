const STORAGE_KEY = "admin_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setSessionToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
  // Notify same-tab listeners (storage event only fires cross-tab natively)
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function clearSessionToken() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}
