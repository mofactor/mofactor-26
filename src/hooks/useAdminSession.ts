"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionToken, clearSessionToken } from "@/lib/admin-auth";
import { useState, useEffect, useCallback } from "react";

export function useAdminSession() {
  // undefined = haven't read localStorage yet (SSR / initial hydration)
  // null     = checked localStorage, no token present
  // string   = token found in localStorage
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setToken(getSessionToken());

    const sync = () => setToken(getSessionToken());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const isValid = useQuery(
    api.auth.validateSession,
    token ? { token } : "skip"
  );

  // Loading until we've read localStorage AND validated with Convex
  const isLoading =
    token === undefined || (token !== null && isValid === undefined);
  const isAuthenticated = isValid === true;

  const logout = useCallback(() => {
    clearSessionToken();
  }, []);

  return { token: token ?? null, isAuthenticated, isLoading, logout };
}
