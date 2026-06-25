import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    backend: hasAdminSession(request, "backend"),
    action: hasAdminSession(request, "action"),
  });
}
