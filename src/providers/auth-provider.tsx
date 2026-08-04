"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService, tokenStore } from "@/lib/api";
import { ROLE_HOME } from "@/lib/constants";
import type { User } from "@/types/domain";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (fullName: string, email: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "lakshya72.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cached = window.localStorage.getItem(USER_KEY);
    if (cached && tokenStore.get()) {
      try {
        setUser(JSON.parse(cached) as User);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (fullName: string, email: string) => {
    const { user: next } = await authService.login({ fullName, email });
    window.localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { ROLE_HOME };
