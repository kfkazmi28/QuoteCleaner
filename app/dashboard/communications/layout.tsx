import type { ReactNode } from "react"
import { MessageSquareText } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { CommunicationsSubnav } from "@/components/communications/subnav"

export const metadata = {
  title: "Communications | QuoteCleaner",
  description: "Manage customer email and SMS templates, automations, history, and sending settings.",
}

export default function CommunicationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:ml-64 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Communications</h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Customer emails and texts for quotes, appointments, invoices, and reviews.
              </p>
            </div>
          </div>
        </header>

        <CommunicationsSubnav />

        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}
