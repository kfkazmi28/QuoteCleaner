import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from("cleaning_checklist_leads")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          name: name?.trim() || null,
          source_page: "cleaning-checklist-template",
        },
        { onConflict: "email", ignoreDuplicates: false }
      )

    if (error) {
      console.error("[checklist-lead] db error:", error)
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[checklist-lead] unexpected error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
