import Link from "next/link"
import { CalendarDays, CheckCircle2, Clock3, FileText, TrendingUp } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const reminders = [
  { time: "Today · 10:00 AM", title: "Deep clean · Martinez home", type: "Upcoming job" },
  { time: "Today · 2:30 PM", title: "Follow up with Jamie R.", type: "Quote follow-up" },
  { time: "Tomorrow · 9:00 AM", title: "Send invoice · Sparkle Cleaning Co.", type: "Invoice reminder" },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:ml-64">
        <header className="mb-8">
          <p className="text-lg text-muted-foreground">Good morning, Sarah</p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Here&apos;s what&apos;s happening today.</h1>
        </header>

        <section aria-label="Business summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Quotes sent", "28", "+12% this week", FileText],
            ["Jobs booked", "14", "+8% this week", CheckCircle2],
            ["Revenue", "$8,420", "+12% this week", TrendingUp],
            ["Outstanding", "$1,240", "3 invoices", Clock3],
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

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Upcoming reminders</CardTitle>
              <Link href="/dashboard/calendar" className="text-sm font-semibold text-primary hover:underline">View calendar</Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {reminders.map((reminder) => (
                <div key={reminder.title} className="flex items-start gap-4 rounded-lg border border-border p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><CalendarDays className="size-5" /></div>
                  <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{reminder.type}</p><p className="mt-1 font-semibold text-foreground">{reminder.title}</p><p className="mt-1 text-sm text-muted-foreground">{reminder.time}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Performance</CardTitle><span className="text-sm text-muted-foreground">This month</span></CardHeader>
            <CardContent className="flex flex-col gap-5">
              {[['Quote conversion', '64%', 'of sent quotes booked'], ['Average job value', '$602', 'up from $548 last month'], ['Repeat clients', '78%', 'of your booked jobs']].map(([label, value, detail]) => <div key={label}><div className="flex items-end justify-between gap-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold text-foreground">{value}</p></div><p className="mt-1 text-xs text-muted-foreground">{detail}</p><div className="mt-3 h-2 rounded-full bg-accent"><div className="h-2 rounded-full bg-primary" style={{ width: value === '64%' ? '64%' : value === '78%' ? '78%' : '72%' }} /></div></div>)}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/calculator" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create a quote</Link><Link href="/dashboard/contacts" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">View contacts</Link></div>
      </main>
    </div>
  )
}
