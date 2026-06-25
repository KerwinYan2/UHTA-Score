import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export type AdminRole = "backend" | "action";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const COOKIE_NAMES: Record<AdminRole, string> = {
  backend: "uhta_backend_session",
  action: "uhta_action_session",
};

export function getAdminPassword(role: AdminRole): string {
  if (role === "backend") {
    return process.env.UHTA_BACKEND_PASSWORD ?? "11224455";
  }
  return process.env.UHTA_ACTION_PASSWORD ?? "299299";
}

export function isAdminRole(value: unknown): value is AdminRole {
  return value === "backend" || value === "action";
}

export function isValidAdminPassword(role: AdminRole, password: unknown): boolean {
  return typeof password === "string" && password === getAdminPassword(role);
}

export function hasAdminSession(request: NextRequest, role: AdminRole): boolean {
  const token = request.cookies.get(COOKIE_NAMES[role])?.value;
  return verifySessionToken(role, token);
}

export function setAdminSessionCookie(
  request: NextRequest,
  response: NextResponse,
  role: AdminRole
): void {
  response.cookies.set(COOKIE_NAMES[role], createSessionToken(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(request),
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearAdminSessionCookie(response: NextResponse, role: AdminRole): void {
  response.cookies.set(COOKIE_NAMES[role], "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

function createSessionToken(role: AdminRole): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${role}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(role: AdminRole, token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenRole, rawExpiresAt, signature] = parts;
  if (tokenRole !== role) return false;

  const expiresAt = Number(rawExpiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const payload = `${tokenRole}.${rawExpiresAt}`;
  return safeEqual(signature, sign(payload));
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function getSessionSecret(): string {
  return (
    process.env.UHTA_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    "uhta-local-development-session-secret"
  );
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function isHttpsRequest(request: NextRequest): boolean {
  return (
    request.headers.get("x-forwarded-proto") === "https" ||
    request.nextUrl.protocol === "https:"
  );
}
