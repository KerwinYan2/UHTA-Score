import { NextRequest, NextResponse } from "next/server";
import {
  isAdminRole,
  isValidAdminPassword,
  setAdminSessionCookie,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  let body: { role?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { role?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isAdminRole(body.role)) {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }

  if (!isValidAdminPassword(body.role, body.password)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: body.role });
  setAdminSessionCookie(request, response, body.role);
  return response;
}
