import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING })

  try {
    await client.connect()

    await client.query(`
      ALTER TABLE public.invoices
        ADD COLUMN IF NOT EXISTS calendar_event_id UUID
          REFERENCES public.calendar_events(id) ON DELETE SET NULL;
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS invoices_calendar_event_id_idx
        ON public.invoices (calendar_event_id);
    `)

    return NextResponse.json({ success: true, message: "calendar_event_id column added to invoices table." })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
