# run-recurring

This Supabase Edge Function creates expense rows for any recurring items that are due,
and advances the `next_run_date` for each processed recurring expense.

## Deploy
From the project root:

```bash
supabase functions deploy run-recurring
```

## Schedule (Dashboard)
1. Open Supabase Dashboard → Edge Functions → `run-recurring`.
2. Add a schedule (Cron). Recommended for custom time zones:
   - `0 * * * *` (hourly) and use env vars below.
3. Save.

## Time Zone Settings
Set these in the Edge Function environment variables:
- `RUN_TZ` (IANA time zone, e.g., `Asia/Kolkata`)
- `RUN_AT_HOUR` (0-23)
- `RUN_AT_MINUTE` (0-59)
- `RUN_WINDOW_MINUTES` (default 10)

With the hourly schedule, the function only runs when the local time is within the window.

## Local invoke (optional)
```bash
supabase functions serve run-recurring
```

Then call it locally:
```bash
curl -i http://localhost:54321/functions/v1/run-recurring
```
