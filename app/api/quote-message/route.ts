import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const apiKey = process.env.QuoteCleaner_OpenAI ?? process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "AI is not configured" }, { status: 503 })
    const openai = new OpenAI({ apiKey })
    const tone = typeof body.tone === "string" ? body.tone : "Professional"
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "system", content: `Write a polished client-facing cleaning quote message in a ${tone.toLowerCase()} tone. Include the client name when supplied, service, price, home details, estimated time, and business name. Keep it concise. Return only the message text.` }, { role: "user", content: JSON.stringify(body) }],
    })
    return NextResponse.json({ message: completion.choices[0]?.message.content?.trim() || "" })
  } catch {
    return NextResponse.json({ error: "Unable to generate message" }, { status: 500 })
  }
}
