import type { User, UserRole } from "@/types/domain";
import { USE_MOCK, delay, http, tokenStore } from "../http";
import { mapUser, type ApiAuthResponse, type ApiAuthUser } from "../mappers";
import { db } from "../mock/db";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

/**
 * Password rules come straight from the API spec:
 *   8–72 characters, at least one uppercase, one lowercase and one number.
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 72,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/,
  hint: "At least 8 characters, with an uppercase letter, a lowercase letter and a number.",
};

/** The API rejects '+' in the local part, so this is stricter than usual. */
export const EMAIL_PATTERN = /^[^\s@+]+@[^\s@]+\.[^\s@]+$/;

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_RULES.minLength) return "Password must be at least 8 characters.";
  if (value.length > PASSWORD_RULES.maxLength) return "Password must be 72 characters or fewer.";
  if (!PASSWORD_RULES.pattern.test(value)) return PASSWORD_RULES.hint;
  return null;
}

export function validateEmail(value: string): string | null {
  if (!EMAIL_PATTERN.test(value.trim())) {
    return value.includes("+")
      ? "Email addresses with '+' aren't accepted."
      : "Enter a valid email address.";
  }
  return null;
}

/**
 * The API's accepted role strings don't match the app's own vocabulary — it
 * takes "sales" and "admin", but rejects "accounts". Everything crossing the
 * wire goes through here so the correct spelling lives in one place.
 *
 * CONFIRM the accounts value with the backend and adjust this map only.
 */
const API_ROLE: Record<UserRole, string> = {
  sales: "sales",
  accounts: "account",
  admin: "admin",
};

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    if (!USE_MOCK) {
      const result = await http.post<ApiAuthResponse>("/auth/login", {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      });
      tokenStore.set(result.token, result.refreshToken);

      /*
        The login response carries a trimmed user object without `role` or
        `fullName`, so the role would fall back to guessing. /users/profile
        returns the complete record — fetch it before handing the user on.
      */
      let user = mapUser(result.user);
      try {
        const profile = await http.get<ApiAuthUser>("/users/profile");
        user = mapUser(profile);
      } catch {
        // Keep the lean user rather than failing the whole sign-in
      }

      return { token: result.token, user };
    }

    const email = payload.email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === email);
    const user: User = existing ?? {
      id: db.nextId("u"),
      name: "Akshay Kumar",
      email: payload.email,
      role: inferRole(email),
      isActive: true,
    };
    const token = `mock.${user.id}.${Date.now()}`;
    tokenStore.set(token);
    return delay({ token, user }, 500);
  },

  /** Returns the server's message so the UI can show the verification prompt. */
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    if (!USE_MOCK) {
      await http.post<{ user: ApiAuthUser }>("/auth/register", {
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        role: API_ROLE[payload.role],
        password: payload.password,
      });
      return { message: "Registration successful. Check your email to verify your account." };
    }

    db.users.push({
      id: db.nextId("u"),
      name: payload.fullName,
      email: payload.email,
      role: payload.role,
      isActive: true,
    });
    return delay({ message: "Registration successful. You can sign in now." }, 500);
  },

  async me(): Promise<User | null> {
    if (!USE_MOCK) {
      if (!tokenStore.get()) return null;
      const raw = await http.get<ApiAuthUser>("/users/profile");
      return mapUser(raw);
    }
    const token = tokenStore.get();
    if (!token) return null;
    return db.users.find((u) => u.id === token.split(".")[1]) ?? null;
  },

  async verifyEmail(token: string): Promise<void> {
    if (!USE_MOCK) {
      await http.get(`/auth/verify-email/${encodeURIComponent(token)}`);
      return;
    }
    await delay(null, 400);
  },

  async resendVerification(email: string): Promise<void> {
    if (!USE_MOCK) {
      await http.post("/auth/resend-verification-email", { email: email.trim().toLowerCase() });
      return;
    }
    await delay(null, 400);
  },

  async forgotPassword(email: string): Promise<void> {
    if (!USE_MOCK) {
      await http.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      return;
    }
    await delay(null, 400);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!USE_MOCK) {
      await http.post("/auth/reset-password", { token, newPassword });
      return;
    }
    await delay(null, 400);
  },

  /** No logout endpoint on the API — clearing the stored tokens is enough. */
  async logout(): Promise<void> {
    tokenStore.clear();
  },
};

function inferRole(email: string): UserRole {
  if (email.startsWith("admin") || email.startsWith("manager")) return "admin";
  if (email.startsWith("accounts") || email.startsWith("finance")) return "accounts";
  return "sales";
}
