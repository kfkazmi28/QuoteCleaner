import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Upsert — update name if email already exists, otherwise insert
    const { error } = await supabase
      .from("contract_template_leads")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          name: name?.trim() || null,
          source_page: "cleaning-contract-template",
        },
        { onConflict: "email", ignoreDuplicates: false }
      )

    if (error) {
      console.error("[contract-lead] db error:", error)
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[contract-lead] unexpected error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
