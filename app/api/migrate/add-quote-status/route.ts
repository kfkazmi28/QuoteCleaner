import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/migrate/add-quote-status
 * Detects whether the `status` column exists on `saved_quotes`.
 * Returns { ok: true } if ready, { ok: false, sql } with the DDL to run if not.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // A no-op select against the status column — errors if the column doesn't exist
    const { error } = await supabase
      .from("saved_quotes")
      .select("status")
      .limit(1)

    if (!error) {
      return NextResponse.json({ ok: true })
    }

    const isColumnMissing =
      error.message.includes("status") ||
      error.message.includes("column") ||
      error.code === "42703" // PostgreSQL undefined_column

    if (isColumnMissing) {
      return NextResponse.json({
        ok: false,
        reason: "missing_column",
        sql: `ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT NULL;\nCREATE INDEX IF NOT EXISTS saved_quotes_status_idx ON saved_quotes (user_id, status);`,
        message: "Run the SQL above in your Supabase SQL editor to enable the Completed status feature.",
      }, { status: 200 }) // 200 so client can check `ok` field
    }

    return NextResponse.json({ ok: false, reason: "unknown", error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ ok: false, reason: "exception", error: String(err) }, { status: 500 })
  }
}
