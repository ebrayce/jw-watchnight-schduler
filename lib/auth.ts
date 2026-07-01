import { timingSafeEqual, randomBytes, scryptSync, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  role: "admin";
  exp: number;
};

function parsePasswordHash(storedHash: string): { salt: Buffer; hash: Buffer } {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) {
    throw new Error("Invalid ADMIN_PASSWORD_HASH format");
  }

  return {
    salt: Buffer.from(saltHex, "hex"),
    hash: Buffer.from(hashHex, "hex"),
  };
}

export function hashPassword(password: string, salt?: Buffer): string {
  const passwordSalt = salt ?? randomBytes(16);
  const derived = scryptSync(password, passwordSalt, 64);
  return `${passwordSalt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string): boolean {
  const { salt, hash } = parsePasswordHash(env.ADMIN_PASSWORD_HASH);
  const candidate = scryptSync(password, salt, hash.length);
  return timingSafeEqual(candidate, hash);
}

function signSession(payload: SessionPayload): string {
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", env.SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expected = createHmac("sha256", env.SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as SessionPayload;
    if (payload.role !== "admin" || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createAdminSession(): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = signSession({ role: "admin", exp });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return verifySessionToken(token) !== null;
}

export const sessionCookieName = SESSION_COOKIE;

