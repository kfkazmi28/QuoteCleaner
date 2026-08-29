import "server-only"

import OpenAI from "openai"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const quoteReviewSchema = z.object({
  confidenceScore: z.number().int().min(1).max(5),
  estimatedMarketPriceRange: z.object({ min: z.number(), max: z.number() }),
  pricingFeedback: z.string(),
  suggestedUpsells: z.array(z.string()),
  missingServices: z.array(z.string()),
  estimatedLaborHours: z.number().min(0),
  estimatedProfit: z.number(),
  summary: z.string(),
})

export type QuoteReview = z.infer<typeof quoteReviewSchema>

export interface QuoteReviewInput {
  squareFootage: number
  bedrooms: number
  bathrooms: number
  serviceType: string
  cleaningLevel: string
  recurringFrequency: string
  pets: number
  addOns: string[]
  estimatedHours: number
  notes: string
  checklist: unknown
  totalPrice: number
}

export async function reviewQuote(input: QuoteReviewInput): Promise<QuoteReview> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a pricing advisor for professional cleaning businesses. Analyze quotes without changing the provided pricing algorithm. Return only valid JSON matching the requested fields. Use USD, estimate a realistic local-market range conservatively, calculate estimated profit as revenue minus estimated labor at 55% of revenue, and never invent certainty. Keep the summary and feedback concise.",
      },
      {
        role: "user",
        content: JSON.stringify({ task: "Review this generated cleaning quote", quote: input, outputFields: quoteReviewSchema.keyof().options }),
      },
    ],
  })

  const raw = completion.choices[0]?.message.content
  if (!raw) throw new Error("The AI returned an empty quote review")
  return quoteReviewSchema.parse(JSON.parse(raw))
}
