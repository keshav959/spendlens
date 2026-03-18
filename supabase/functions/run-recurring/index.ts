// Supabase Edge Function: run-recurring
// Creates expenses for due recurring items and advances their next_run_date.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const runTimeZone = Deno.env.get("RUN_TZ") ?? "UTC";
const runAtHour = Number(Deno.env.get("RUN_AT_HOUR") ?? "0");
const runAtMinute = Number(Deno.env.get("RUN_AT_MINUTE") ?? "0");
const runWindowMinutes = Number(Deno.env.get("RUN_WINDOW_MINUTES") ?? "10");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const toISODate = (value: Date) => value.toISOString().slice(0, 10);

const getLocalParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
};

const getLocalDateString = (date: Date, timeZone: string) => {
  const parts = getLocalParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const getLocalMinutesSinceMidnight = (date: Date, timeZone: string) => {
  const parts = getLocalParts(date, timeZone);
  return Number(parts.hour) * 60 + Number(parts.minute);
};

const computeNextRunDate = (from: Date, frequency: string, dayOfMonth?: number | null) => {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (frequency === "WEEKLY") {
    const next = new Date(base);
    next.setDate(base.getDate() + 7);
    return toISODate(next);
  }

  const dom = dayOfMonth && dayOfMonth > 0 ? dayOfMonth : base.getDate();
  const nextMonth = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  nextMonth.setDate(Math.min(dom, lastDay));
  return toISODate(nextMonth);
};

Deno.serve(async () => {
  const now = new Date();
  const today = getLocalDateString(now, runTimeZone);
  const currentMinutes = getLocalMinutesSinceMidnight(now, runTimeZone);
  const targetMinutes = runAtHour * 60 + runAtMinute;

  if (runWindowMinutes >= 0 && Math.abs(currentMinutes - targetMinutes) > runWindowMinutes) {
    return new Response(JSON.stringify({
      success: true,
      skipped: true,
      reason: "Outside run window",
      now: currentMinutes,
      target: targetMinutes,
      timeZone: runTimeZone,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: dueItems, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("active", true)
    .lte("next_run_date", today);

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let processed = 0;

  for (const item of dueItems ?? []) {
    const { error: insertError } = await supabase.from("expenses").insert({
      user_id: item.user_id,
      title: item.title,
      description: item.description,
      amount: item.amount,
      category: item.category,
      expense_date: item.next_run_date,
    });

    if (insertError) {
      console.error("Failed to insert expense", insertError.message);
      continue;
    }

    const nextRunDate = computeNextRunDate(
      new Date(item.next_run_date),
      item.frequency,
      item.day_of_month,
    );

    const { error: updateError } = await supabase
      .from("recurring_expenses")
      .update({
        next_run_date: nextRunDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateError) {
      console.error("Failed to update recurring expense", updateError.message);
      continue;
    }

    processed += 1;
  }

  return new Response(JSON.stringify({ success: true, processed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
