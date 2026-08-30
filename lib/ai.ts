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
  recommendation: z.enum(["Send Quote", "Adjust Quote", "Do Not Send Yet"]).default("Adjust Quote"),
  recommendationReason: z.string().default("Review the quote against the 25-50-25 model before sending."),
})

export type QuoteReview = z.infer<typeof quoteReviewSchema>

export interface QuoteReviewInput {
  squareFootage: number
  bedrooms: number
  bathrooms: number
  city?: string
  zip?: string
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
        content: "You are a cleaning business pricing consultant with expertise in residential cleaning companies using the 25-50-25 profit model. Analyze each quote as if you were coaching the owner. Do not change the provided pricing algorithm. Use the 25-50-25 profit model as the primary framework: 50% of revenue is the target maximum for fully loaded direct labor (cleaner wages, payroll taxes, workers' compensation, and basic supplies), 25% is allocated to overhead and marketing (software, insurance, fuel, maintenance, ads, and SEO), and 25% is the target net profit after all expenses. For this review, calculate target direct labor budget as totalPrice * 0.50, target overhead and marketing allocation as totalPrice * 0.25, and target net profit as totalPrice * 0.25. Compare the estimated fully loaded labor cost against the 50% labor budget and flag quotes that cannot support the 25% net-profit target. If a loaded labor rate is not provided, use $25/hour only as an explicit planning assumption; do not confuse gross margin with net profit. Return ONLY one valid JSON object with EVERY field listed below, including estimatedMarketPriceRange as an object with numeric min and max. confidenceScore must be a whole number from 1 to 5. suggestedUpsells and missingServices must always be arrays, even when empty. estimatedLaborHours and estimatedProfit must be numbers. Treat estimatedProfit as the model-based target net profit, calculated as totalPrice * 0.25 when the quote supports the model; otherwise calculate the expected remainder after direct labor and the 25% overhead allocation. Use the city and ZIP when provided to make the market range more relevant, but never invent local data. Explain whether the quote meets each target. If it misses a target, recommend a specific price increase or operational adjustment. Suggest relevant upsells based on the selected package and property details, estimate customer acceptance based on price and package, and warn about potential labor overruns or unusually risky jobs. Keep the response concise, actionable, and written for a cleaning business owner—not an accountant. Finish with exactly one recommendation: Send Quote, Adjust Quote, or Do Not Send Yet, plus a one-sentence explanation. Explicitly mention the 25-50-25 allocation, revenue, estimated labor hours, labor-cost assumption, direct labor budget, overhead allocation, and estimated net profit in pricingFeedback, and keep the summary concise. Required shape: {confidenceScore: 4, estimatedMarketPriceRange: {min: 250, max: 350}, pricingFeedback: \"...\", suggestedUpsells: [], missingServices: [], estimatedLaborHours: 3.5, estimatedProfit: 25, summary: \"...\", recommendation: \"Send Quote\", recommendationReason: \"...\"}.",
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
    estimatedProfit: parsed.estimatedProfit ?? input.totalPrice * 0.25,
  })
}
