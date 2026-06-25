import { NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/adminAuth";

export function isAuthorizedHistoryRequest(request: NextRequest): boolean {
  return hasAdminSession(request, "backend") || hasAdminSession(request, "action");
}
