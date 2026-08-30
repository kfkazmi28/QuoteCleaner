import { NextResponse } from "next/server"
import { z } from "zod"
import { reviewQuote } from "@/lib/ai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = quoteReviewSchemaInput.parse(body)
    const review = await reviewQuote({ ...input, checklist: input.checklist ?? {} })
    return NextResponse.json(review)
  } catch (error) {
    console.error("[v0] Quote review failed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to review quote" }, { status: 400 })
  }
}

const quoteReviewSchemaInput = z.object({
  squareFootage: z.number().nonnegative(),
  bedrooms: z.number().nonnegative(),
  bathrooms: z.number().nonnegative(),
  city: z.string().max(100).optional().default(""),
  zip: z.string().max(20).optional().default(""),
  serviceType: z.string().max(100),
  cleaningLevel: z.string().max(50),
  recurringFrequency: z.string().max(50),
  pets: z.number().nonnegative(),
  addOns: z.array(z.string().max(100)).max(30),
  estimatedHours: z.number().nonnegative(),
  notes: z.string().max(2000),
  checklist: z.unknown(),
  totalPrice: z.number().nonnegative(),
})
