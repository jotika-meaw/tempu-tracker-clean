import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./validation";
import { DEMO_ACCOUNTS, type UserRole } from "../shared/accounts";

export type { UserRole };

export type AuthUser = {
  username: string;
  role: UserRole;
  displayName: string;
};

type Account = AuthUser & { passwordHash: Buffer };

export const AUTH_HEADER = "x-tempu-auth";
export const AUTH_TOKEN_TTL_SECONDS = 12 * 60 * 60;

function hashPassword(password: string): Buffer {
  return createHash("sha256").update(`tempu-tracker:${password}`, "utf8").digest();
}

const accounts: ReadonlyMap<string, Account> = new Map(
  DEMO_ACCOUNTS.map(({ password, ...user }) => [
    user.username,
    { ...user, passwordHash: hashPassword(password) },
  ])
);

/**
 * Pick the token-signing secret. AUTH_SECRET is preferred. Without it, a
 * secret is derived from the Meta API key so every serverless instance
 * agrees; with neither, a random per-process secret is used (tokens then
 * stop working on restart).
 */
export function resolveAuthSecret(authSecret: string | null, modelApiKey: string | null): string {
  if (authSecret) return authSecret;
  if (modelApiKey) {
    return createHmac("sha256", modelApiKey).update("tempu-tracker-auth-v1").digest("base64url");
  }
  return randomBytes(32).toString("base64url");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueToken(user: AuthUser, secret: string, now: Date): { token: string; expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + AUTH_TOKEN_TTL_SECONDS * 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: user.username, role: user.role, exp: Math.floor(expiresAt.getTime() / 1000) }),
    "utf8"
  ).toString("base64url");
  return { token: `${payload}.${sign(payload, secret)}`, expiresAt };
}

export function verifyToken(token: string, secret: string, now: Date): AuthUser | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: unknown;
      role?: unknown;
      exp?: unknown;
    };
    if (typeof claims.sub !== "string" || typeof claims.exp !== "number") return null;
    if (claims.exp * 1000 <= now.getTime()) return null;

    const account = accounts.get(claims.sub);
    if (!account || account.role !== claims.role) return null;
    return { username: account.username, role: account.role, displayName: account.displayName };
  } catch {
    return null;
  }
}

export function authenticate(username: unknown, password: unknown): AuthUser | null {
  if (typeof username !== "string" || typeof password !== "string") return null;
  if (username.length > 100 || password.length > 200) return null;

  const account = accounts.get(username.trim().toLowerCase());
  const candidate = hashPassword(password);
  // Compare even for unknown users so response time does not reveal them.
  const reference = account?.passwordHash ?? hashPassword(randomBytes(16).toString("hex"));
  const matches = timingSafeEqual(candidate, reference);
  if (!account || !matches) return null;
  return { username: account.username, role: account.role, displayName: account.displayName };
}

export type AuthOptions = {
  required: boolean;
  secret: string;
  clock: () => Date;
};

/** Express middleware that allows only the given roles when auth is required. */
export function requireRole(options: AuthOptions, roles: readonly UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.required) {
      next();
      return;
    }

    const header = req.headers[AUTH_HEADER];
    const token = typeof header === "string" ? header.trim() : "";
    const user = token ? verifyToken(token, options.secret, options.clock()) : null;

    if (!user) {
      next(new ApiError(401, "AUTH_REQUIRED", "Please sign in to use this feature."));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new ApiError(403, "ROLE_NOT_ALLOWED", "This account cannot use this feature."));
      return;
    }
    (res.locals as { user?: AuthUser }).user = user;
    next();
  };
}
