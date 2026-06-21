import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedHistoryRequest } from "@/lib/historyAuth";
import { getSupabaseAdmin, isCloudEnabled } from "@/lib/supabase/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isCloudEnabled()) {
    return NextResponse.json({ enabled: false, ok: true });
  }

  if (!isAuthorizedHistoryRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin()!;
  const { error } = await supabase.from("match_records").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ enabled: true, ok: true });
}
