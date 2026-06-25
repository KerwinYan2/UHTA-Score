import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, isAdminRole } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  let body: { role?: unknown } = {};
  try {
    body = (await request.json()) as { role?: unknown };
  } catch {
    body = {};
  }

  const response = NextResponse.json({ ok: true });
  if (isAdminRole(body.role)) {
    clearAdminSessionCookie(response, body.role);
  } else {
    clearAdminSessionCookie(response, "backend");
    clearAdminSessionCookie(response, "action");
  }

  return response;
}
