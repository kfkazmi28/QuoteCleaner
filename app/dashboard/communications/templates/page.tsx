import { getTemplates } from "@/app/actions/communications"
import { TemplatesManager } from "@/components/communications/templates-manager"

export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  const { data, error } = await getTemplates()
  return <TemplatesManager initialTemplates={data} loadError={error} />
}
