import { getAutomations, getTemplates } from "@/app/actions/communications"
import { AutomationsManager } from "@/components/communications/automations-manager"

export const dynamic = "force-dynamic"

export default async function AutomationsPage() {
  const [{ data: automations, error }, { data: templates }] = await Promise.all([getAutomations(), getTemplates()])
  return <AutomationsManager initialAutomations={automations} templates={templates} loadError={error} />
}
