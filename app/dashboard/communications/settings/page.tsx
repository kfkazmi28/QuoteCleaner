import { getCommunicationSettings } from "@/app/actions/communications"
import { SettingsForm } from "@/components/communications/settings-form"

export const dynamic = "force-dynamic"

export default async function CommunicationSettingsPage() {
  const { data, error } = await getCommunicationSettings()
  return <SettingsForm initial={data} loadError={error} />
}
