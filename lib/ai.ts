import "server-only"

import OpenAI from "openai"
import { z } from "zod"

function getOpenAI() {
  const apiKey = process.env.QuoteCleaner_OpenAI ?? process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("QuoteCleaner_OpenAI is not configured")
  return new OpenAI({ apiKey })
}

export const quoteReviewSchema = z.object({
  confidenceScore: z.coerce.number().transform((value) => Math.max(1, Math.min(5, Math.round(value)))),
  estimatedMarketPriceRange: z.object({ min: z.coerce.number(), max: z.coerce.number() }),
  pricingFeedback: z.string().default("Pricing looks reasonable for the provided quote details."),
  suggestedUpsells: z.array(z.string()).default([]),
  missingServices: z.array(z.string()).default([]),
  estimatedLaborHours: z.coerce.number().min(0),
  estimatedProfit: z.coerce.number(),
  summary: z.string().default("Your quote has been reviewed."),
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
  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a pricing advisor for professional cleaning businesses. Analyze quotes without changing the provided pricing algorithm. Return ONLY one valid JSON object with EVERY field listed below, including estimatedMarketPriceRange as an object with numeric min and max. confidenceScore must be a whole number from 1 to 5. suggestedUpsells and missingServices must always be arrays, even when empty. estimatedLaborHours and estimatedProfit must be numbers. Use USD, estimate a realistic local-market range conservatively, calculate estimated labor cost from the provided estimatedLaborHours using a reasonable $25/hour internal labor-cost assumption, then calculate estimated profit as totalPrice minus estimated labor cost. Explicitly mention the labor-hours, labor-cost assumption, revenue, and profit in pricingFeedback, and keep the summary concise. Required shape: {confidenceScore: 4, estimatedMarketPriceRange: {min: 250, max: 350}, pricingFeedback: \"...\", suggestedUpsells: [], missingServices: [], estimatedLaborHours: 3.5, estimatedProfit: 90, summary: \"...\"}.",
      },
      {
        role: "user",
        content: JSON.stringify({ task: "Review this generated cleaning quote", quote: input, outputFields: quoteReviewSchema.keyof().options }),
      },
    ],
  })

  const raw = completion.choices[0]?.message.content
  if (!raw) throw new Error("The AI returned an empty quote review")
  const parsed = JSON.parse(raw) as Record<string, unknown>
  const range = (parsed.estimatedMarketPriceRange ?? {}) as Record<string, unknown>
  const marketMin = Number(range.min ?? input.totalPrice * 0.9)
  const marketMax = Number(range.max ?? input.totalPrice * 1.15)
  return quoteReviewSchema.parse({
    ...parsed,
    confidenceScore: parsed.confidenceScore ?? 3,
    estimatedMarketPriceRange: { min: marketMin, max: marketMax },
    estimatedLaborHours: parsed.estimatedLaborHours ?? input.estimatedHours,
    estimatedProfit: parsed.estimatedProfit ?? input.totalPrice * 0.45,
  })
}
