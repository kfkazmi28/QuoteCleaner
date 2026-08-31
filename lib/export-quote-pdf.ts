import type { SendQuoteData } from "@/components/send-quote-modal"

/**
 * Opens a print-ready quote page in a new tab.
 * The user can save it as PDF via the browser's Print → Save as PDF flow.
 */
export function exportQuotePdf(data: SendQuoteData): void {
  const params = new URLSearchParams()

  const selectedName = data.selectedTier || data.quoteName || "Quote"
  const selectedKey = selectedName.toLowerCase()
  params.set("name", selectedName)
  const selectedPrice = selectedKey.includes("deep") ? data.resultDeepClean : selectedKey.includes("move") ? data.resultMoveIn : selectedKey.includes("monthly") ? data.resultMonthly : selectedKey.includes("bi") ? data.resultBiweekly : selectedKey.includes("weekly") ? data.resultWeekly : data.resultStandard
  params.set("price", String(selectedPrice ?? 0))

  params.set("standard",  String(data.resultStandard  ?? 0))
  params.set("deep",      String(data.resultDeepClean ?? 0))
  params.set("movein",    String(data.resultMoveIn    ?? 0))
  params.set("monthly",   String(data.resultMonthly   ?? 0))
  params.set("biweekly",  String(data.resultBiweekly  ?? 0))
  params.set("weekly",    String(data.resultWeekly    ?? 0))

  const url = `/quote/print?${params.toString()}`
  window.open(url, "_blank", "noopener,noreferrer")
}
