import { NextRequest } from "next/server";
import { getHistoryPassword } from "@/lib/supabase/admin";

export function isAuthorizedHistoryRequest(request: NextRequest): boolean {
  const password = request.headers.get("x-history-password");
  return password === getHistoryPassword();
}
