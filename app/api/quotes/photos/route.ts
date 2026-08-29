import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const quoteId = formData.get("quoteId") as string

    if (!file || !quoteId) {
      return NextResponse.json({ error: "Missing file or quoteId" }, { status: 400 })
    }

    const blob = await put(`quotes/${quoteId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Append the new URL to the quote's photos array
    const supabase = await createClient()
    const { data: quote } = await supabase
      .from("saved_quotes")
      .select("photos")
      .eq("id", quoteId)
      .single()

    const existing: string[] = quote?.photos ?? []
    await supabase
      .from("saved_quotes")
      .update({ photos: [...existing, blob.url] })
      .eq("id", quoteId)

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Photo upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url, quoteId } = await request.json()
    if (!url || !quoteId) {
      return NextResponse.json({ error: "Missing url or quoteId" }, { status: 400 })
    }

    await del(url)

    const supabase = await createClient()
    const { data: quote } = await supabase
      .from("saved_quotes")
      .select("photos")
      .eq("id", quoteId)
      .single()

    const updated = (quote?.photos ?? []).filter((p: string) => p !== url)
    await supabase.from("saved_quotes").update({ photos: updated }).eq("id", quoteId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Photo delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
