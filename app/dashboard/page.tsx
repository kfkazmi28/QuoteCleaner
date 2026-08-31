import Link from "next/link"
import { CalendarDays, CheckCircle2, Clock3, FileText, TrendingUp } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSavedQuotes } from "@/app/actions/quotes"
import { getInvoices } from "@/app/actions/invoices"
import { getUpcomingEvents, getDashboardChartEvents } from "@/app/actions/calendar"
import { DashboardRevenueChart } from "@/components/dashboard-revenue-chart"
import { getClientContacts } from "@/app/actions/contacts"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const [{ data: quotes }, invoices, upcomingEvents, contacts, supabase] = await Promise.all([
    getSavedQuotes(),
    getInvoices(),
    getUpcomingEvents(3),
    getClientContacts(),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()
  const savedQuotes = quotes ?? []
  const events = upcomingEvents.data ?? []
  const chartYear = new Date().getFullYear()
  const chartMonth = new Date().getMonth() + 1
  const chartFrom = `${chartYear}-${String(chartMonth).padStart(2, "0")}-01`
  const chartTo = `${chartYear}-${String(chartMonth).padStart(2, "0")}-${String(new Date(chartYear, chartMonth, 0).getDate()).padStart(2, "0")}`
  const { data: chartEvents } = await getDashboardChartEvents(chartFrom, chartTo)
  const revenue = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.amount_total || 0), 0)
  const outstanding = invoices.filter((invoice) => invoice.status === "sent").reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0)
  const bookedJobs = events.filter((event) => event.status !== "canceled").length
  const formatReminderDate = (value?: string | null) => {
    if (!value) return ""
    const [year, month, day] = String(value).split("T")[0].split("-")
    if (!year || !month || !day) return String(value)
    return `${month}/${day}/${year}`
  }
  const formatReminderTime = (value?: string | null) => {
    if (!value) return ""
    const [rawHour, rawMinute] = String(value).slice(0, 5).split(":")
    const hour = Number(rawHour)
    if (Number.isNaN(hour)) return ""
    const period = hour >= 12 ? "pm" : "am"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const minute = rawMinute && rawMinute !== "00" ? `:${rawMinute}` : ""
    return `${displayHour}${minute}${period}`
  }
  const reminders = events.map((event) => {
    const dateLabel = formatReminderDate(event.scheduled_date)
    const startLabel = formatReminderTime(event.start_time)
    const endLabel = formatReminderTime(event.end_time)
    const timeRange = startLabel ? (endLabel ? `${startLabel}-${endLabel}` : startLabel) : ""
    return {
      time: [dateLabel, timeRange].filter(Boolean).join(" · "),
      title: `${event.event_type === "quote-linked" ? event.package_name || "Cleaning job" : event.event_type} · ${event.client_name || "Client"}`,
      type: event.event_type === "quote-linked" ? "Upcoming job" : "Calendar event",
    }
  })
  const displayName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there"
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:ml-64">
        <header className="mb-8">
          <p className="text-lg text-muted-foreground">Good morning, {displayName}</p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Here&apos;s what&apos;s happening today.</h1>
        </header>

        <section aria-label="Business summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Quotes sent", String(savedQuotes.length), "Saved quotes", FileText],
            ["Jobs booked", String(bookedJobs), "Upcoming events", CheckCircle2],
            ["Revenue", `$${revenue.toLocaleString()}`, "Paid invoices", TrendingUp],
            ["Outstanding", `$${outstanding.toLocaleString()}`, `${invoices.filter((invoice) => invoice.status === "sent").length} invoices`, Clock3],
          ].map(([label, value, change, Icon]) => (
            <Card key={label as string}>
              <CardContent className="flex flex-col gap-4 p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted-foreground">{label as string}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{value as string}</p>
                  <p className="mt-2 text-sm font-medium text-primary">{change as string}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="mt-6">
          <DashboardRevenueChart events={chartEvents ?? []} year={chartYear} month={chartMonth} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Upcoming reminders</CardTitle>
              <Link href="/dashboard/calendar" className="text-sm font-semibold text-primary hover:underline">View calendar</Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {reminders.length ? reminders.map((reminder) => (
                <div key={reminder.title} className="flex items-start gap-4 rounded-lg border border-border p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><CalendarDays className="size-5" /></div>
                  <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{reminder.type}</p><p className="mt-1 font-semibold text-foreground">{reminder.title}</p><p className="mt-1 text-sm text-muted-foreground">{reminder.time}</p></div>
                </div>
              )) : <p className="py-4 text-sm text-muted-foreground">No upcoming events yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Performance</CardTitle><span className="text-sm text-muted-foreground">This month</span></CardHeader>
            <CardContent className="flex flex-col gap-5">
              {[['Saved quotes', String(savedQuotes.length), 'quotes in your workspace'], ['Average invoice', `$${invoices.length ? Math.round(invoices.reduce((sum, invoice) => sum + Number(invoice.amount_total || 0), 0) / invoices.length).toLocaleString() : 0}`, 'across all invoices'], ['Active clients', String(contacts.filter((contact) => contact.is_active !== false).length), 'active contacts']].map(([label, value, detail]) => <div key={label}><div className="flex items-end justify-between gap-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold text-foreground">{value}</p></div><p className="mt-1 text-xs text-muted-foreground">{detail}</p><div className="mt-3 h-2 rounded-full bg-accent"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(8, Number.parseInt(value, 10) || 0))}%` }} /></div></div>)}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/calculator" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create a quote</Link><Link href="/dashboard/contacts" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">View contacts</Link></div>
      </main>
    </div>
  )
}
