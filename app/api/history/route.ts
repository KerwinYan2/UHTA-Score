import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isCloudEnabled } from "@/lib/supabase/admin";
import { MatchRecord } from "@/types/match";

export async function GET(request: NextRequest) {
  if (!isCloudEnabled()) {
    return NextResponse.json({ enabled: false, records: [] });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("match_records")
    .select("data")
    .order("end_time", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const records = (data ?? []).map((row) => row.data as MatchRecord);
  return NextResponse.json({ enabled: true, records });
}

export async function POST(request: NextRequest) {
  if (!isCloudEnabled()) {
    return NextResponse.json({ enabled: false, ok: true });
  }

  let record: MatchRecord;
  try {
    record = (await request.json()) as MatchRecord;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!record?.id || !record.endTime) {
    return NextResponse.json({ error: "Invalid match record" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const { error } = await supabase.from("match_records").upsert({
    id: record.id,
    end_time: record.endTime,
    data: record,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ enabled: true, ok: true });
}
