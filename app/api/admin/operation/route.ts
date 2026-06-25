import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request, "action")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
