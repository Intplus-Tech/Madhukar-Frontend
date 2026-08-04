import type { User, UserRole } from "@/types/domain";
import { USE_MOCK, delay, http, tokenStore } from "../http";
import { db } from "../mock/db";

export interface LoginPayload {
  fullName: string;
  email: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

/**
 * The login screen collects a name and an email — no password field exists in
 * the Figma. CONFIRM with the backend whether this is an OTP flow, an SSO
 * hand-off, or whether a password field is still to be designed.
 */
export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    if (!USE_MOCK) {
      const result = await http.post<LoginResult>("/auth/login", payload);
      tokenStore.set(result.token);
      return result;
    }

    const email = payload.email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === email);

    // Mock convenience: route by email prefix so every role is reachable.
    const role: UserRole = existing?.role ?? inferRole(email);
    const user: User = existing ?? {
      id: db.nextId("u"),
      name: payload.fullName.trim() || "Akshay Kumar",
      email: payload.email,
      role,
      isActive: true,
    };

    const token = `mock.${user.id}.${Date.now()}`;
    tokenStore.set(token);
    return delay({ token, user }, 500);
  },

  async me(): Promise<User | null> {
    if (!USE_MOCK) return http.get<User>("/auth/me");
    const token = tokenStore.get();
    if (!token) return null;
    const id = token.split(".")[1];
    return db.users.find((u) => u.id === id) ?? null;
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) await http.post("/auth/logout").catch(() => undefined);
    tokenStore.clear();
  },
};

function inferRole(email: string): UserRole {
  if (email.startsWith("admin") || email.startsWith("manager")) return "admin";
  if (email.startsWith("accounts") || email.startsWith("finance")) return "accounts";
  return "sales";
}
