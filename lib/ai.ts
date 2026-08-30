import "server-only"

import OpenAI from "openai"
import { z } from "zod"

function getOpenAI() {
  const apiKey = process.env.QuoteCleaner_OpenAI ?? process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("QuoteCleaner_OpenAI is not configured")
  return new OpenAI({ apiKey })
}

export const pricingHealthSchema = z.object({
  status: z.enum(["Healthy", "Monitor", "Review", "Underpriced"]),
  confidenceScore: z.number().min(1).max(5),
  laborBudget: z.number(),
  estimatedLaborCost: z.number(),
  laborVariance: z.number(),
  variancePercent: z.number(),
  overheadBudget: z.number(),
  profitTarget: z.number(),
  message: z.string(),
})

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
  pricingHealth: pricingHealthSchema,
  whyGoodQuote: z.string().default("This quote balances labor, overhead, and profit targets."),
  profitabilityActions: z.array(z.string()).default([]),
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
  const laborBudget = input.totalPrice * 0.5
  const overheadBudget = input.totalPrice * 0.25
  const profitTarget = input.totalPrice * 0.25
  const estimatedLaborCost = input.estimatedHours * 25
  const laborVariance = estimatedLaborCost - laborBudget
  const variancePercent = laborBudget > 0 ? (laborVariance / laborBudget) * 100 : 0
  const tolerance = Math.max(10, laborBudget * 0.02)
  const pricingHealth = laborVariance <= tolerance
    ? { status: "Healthy" as const, confidenceScore: 5, message: "Your pricing aligns well with the 25-50-25 profit model. Minor differences between estimated labor and the labor budget are expected and well within normal estimating tolerance." }
    : laborVariance <= 25
      ? { status: "Monitor" as const, confidenceScore: 4, message: "Your labor cost is slightly above the target allocation. The quote is still reasonable, but monitor actual cleaning time to maintain your profit goals." }
      : laborVariance <= 50
        ? { status: "Review" as const, confidenceScore: 3, message: "This quote is beginning to exceed the recommended labor allocation. Consider increasing the price or reducing estimated labor time." }
        : { status: "Underpriced" as const, confidenceScore: 2, message: "This quote is likely underpriced according to the 25-50-25 model. Direct labor is consuming too much of the total price and may reduce your target profit." }
  const health = { ...pricingHealth, laborBudget, estimatedLaborCost, laborVariance, variancePercent, overheadBudget, profitTarget }
  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a cleaning business pricing consultant with expertise in residential cleaning companies using the 25-50-25 profit model. Analyze each quote as if you were coaching the owner. Do not change the provided pricing algorithm. Use the 25-50-25 profit model as the primary framework: 50% of revenue is the target maximum for fully loaded direct labor (cleaner wages, payroll taxes, workers' compensation, and basic supplies), 25% is allocated to overhead and marketing (software, insurance, fuel, maintenance, ads, and SEO), and 25% is the target net profit after all expenses. For this review, calculate target direct labor budget as totalPrice * 0.50, target overhead and marketing allocation as totalPrice * 0.25, and target net profit as totalPrice * 0.25. The application has already calculated pricingHealth and is the sole authority for pricing status and confidence. Never recalculate, override, or contradict pricingHealth.status or pricingHealth.confidenceScore. If a loaded labor rate is not provided, use $25/hour only as an explicit planning assumption; do not confuse gross margin with net profit. Return ONLY one valid JSON object with EVERY field listed below, including estimatedMarketPriceRange as an object with numeric min and max. confidenceScore must be a whole number from 1 to 5. suggestedUpsells and missingServices must always be arrays, even when empty. estimatedLaborHours and estimatedProfit must be numbers. Treat estimatedProfit as the model-based target net profit, calculated as totalPrice * 0.25 when the quote supports the model; otherwise calculate the expected remainder after direct labor and the 25% overhead allocation. Use the city and ZIP when provided to make the market range more relevant, but never invent local data. Explain whether the quote meets each target. If it misses a target, recommend a specific price increase or operational adjustment. Suggest relevant upsells based on the selected package and property details, estimate customer acceptance based on price and package, and warn about potential labor overruns or unusually risky jobs. Keep the response concise, actionable, and written for a cleaning business owner—not an accountant. Finish with exactly one recommendation: Send Quote, Adjust Quote, or Do Not Send Yet, plus a one-sentence explanation. Explicitly mention the 25-50-25 allocation, revenue, estimated labor hours, labor-cost assumption, direct labor budget, overhead allocation, and estimated net profit in pricingFeedback, and keep the summary concise. Required shape: {confidenceScore: 4, estimatedMarketPriceRange: {min: 250, max: 350}, pricingFeedback: \"...\", suggestedUpsells: [], missingServices: [], estimatedLaborHours: 3.5, estimatedProfit: 25, summary: \"...\", recommendation: \"Send Quote\", recommendationReason: \"...\"}.",
      },
      {
        role: "user",
        content: JSON.stringify({ task: "Explain this generated cleaning quote", quote: input, pricingHealth: health, instructions: ["Never override pricingHealth.status or pricingHealth.confidenceScore.", "Explain the numbers and the 25-50-25 model in friendly language.", "Suggest optional upsells and missing services only when appropriate.", "Explain why this is a good quote and what could make it more profitable.", "Do not decide whether the quote passes or fails."], outputFields: quoteReviewSchema.keyof().options }),
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
    confidenceScore: health.confidenceScore,
    pricingHealth: health,
    recommendation: health.status === "Healthy" ? "Send Quote" : health.status === "Underpriced" ? "Do Not Send Yet" : "Adjust Quote",
    recommendationReason: health.message,
    estimatedMarketPriceRange: { min: marketMin, max: marketMax },
    estimatedLaborHours: parsed.estimatedLaborHours ?? input.estimatedHours,
    estimatedProfit: parsed.estimatedProfit ?? input.totalPrice * 0.25,
  })
}
