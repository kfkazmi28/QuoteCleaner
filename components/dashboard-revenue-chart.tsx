"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { getDashboardChartEvents } from "@/app/actions/calendar"

type Event = { scheduled_date: string; package_price: number | null; status: string }
type Metric = "revenue" | "appointments"

export function DashboardRevenueChart({ events: initialEvents, year, month }: { events: Event[]; year: number; month: number }) {
  const [metric, setMetric] = useState<Metric>("revenue")
  const [current, setCurrent] = useState({ year, month })
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [loading, setLoading] = useState(false)

  const isInitialMonth = current.year === year && current.month === month

  useEffect(() => {
    if (isInitialMonth) {
      setEvents(initialEvents)
      return
    }
    let active = true
    setLoading(true)
    const from = `${current.year}-${String(current.month).padStart(2, "0")}-01`
    const lastDay = new Date(current.year, current.month, 0).getDate()
    const to = `${current.year}-${String(current.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    getDashboardChartEvents(from, to).then((result) => {
      if (!active) return
      setEvents(result.data ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [current, isInitialMonth, initialEvents])

  const data = useMemo(() => {
    const dates = Array.from(
      { length: new Date(current.year, current.month, 0).getDate() },
      (_, i) => `${current.year}-${String(current.month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    )
    return dates.map((date) => {
      const matching = events.filter((event) => event.scheduled_date === date)
      return {
        date,
        value: metric === "revenue" ? matching.reduce((sum, event) => sum + Number(event.package_price || 0), 0) : matching.length,
      }
    })
  }, [events, metric, current])

  const shiftMonth = (delta: number) =>
    setCurrent((c) => {
      const d = new Date(c.year, c.month - 1 + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })

  const monthLabel = new Date(current.year, current.month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })
  const label = metric === "revenue" ? "Daily revenue" : "Appointments scheduled"
  const appointmentCount = events.length

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Business at a glance</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{label} by date</p>
          </div>
          <ToggleGroup type="single" value={metric} onValueChange={(value) => value && setMetric(value as Metric)} aria-label="Chart metric">
            <ToggleGroupItem value="revenue">Revenue</ToggleGroupItem>
            <ToggleGroupItem value="appointments">Appointments</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-2 py-1.5">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
            <span className="text-xs text-muted-foreground">{appointmentCount} {appointmentCount === 1 ? "appointment" : "appointments"}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ value: { label, color: "var(--chart-1)" } }} className="h-72 w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(value) => value.slice(8)} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => (metric === "revenue" ? `$${value}` : value)} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  formatter={(value) => (metric === "revenue" ? `$${Number(value).toLocaleString()}` : `${value} ${Number(value) === 1 ? "appointment" : "appointments"}`)}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
        {loading ? (
          <p className="mt-3 text-center text-sm text-muted-foreground">Loading {monthLabel}…</p>
        ) : !events.length ? (
          <p className="mt-3 text-center text-sm text-muted-foreground">No scheduled activity for {monthLabel}.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
