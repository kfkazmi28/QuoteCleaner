import { getCommunicationEvents } from "@/app/actions/communications"
import { HistoryTable } from "@/components/communications/history-table"

export const dynamic = "force-dynamic"

export default async function HistoryPage() {
  const { data, error } = await getCommunicationEvents()
  return <HistoryTable events={data} loadError={error} />
}
