"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Event = { scheduled_date: string; package_price: number | null; status: string }
type Range = "month" | "year"
type Metric = "revenue" | "clients"

export function DashboardRevenueChart({ events, year, month }: { events: Event[]; year: number; month: number }) {
  const [range, setRange] = useState<Range>("month")
  const [metric, setMetric] = useState<Metric>("revenue")
  const data = useMemo(() => {
    const dates = range === "month"
      ? Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)
      : Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`)
    return dates.map((date) => {
      const matching = events.filter((event) => range === "month" ? event.scheduled_date === date : event.scheduled_date.startsWith(date))
      return { date, value: metric === "revenue" ? matching.reduce((sum, event) => sum + Number(event.package_price || 0), 0) : matching.length }
    })
  }, [events, metric, range, year, month])
  const label = metric === "revenue" ? "Daily revenue" : "Clients scheduled"
  return <Card>
    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><CardTitle>Business at a glance</CardTitle><p className="mt-1 text-sm text-muted-foreground">{label} by date</p></div>
      <div className="flex flex-wrap gap-2">
        <ToggleGroup type="single" value={metric} onValueChange={(value) => value && setMetric(value as Metric)} aria-label="Chart metric">
          <ToggleGroupItem value="revenue">Revenue</ToggleGroupItem><ToggleGroupItem value="clients">Clients</ToggleGroupItem>
        </ToggleGroup>
        <Select value={range} onValueChange={(value) => setRange(value as Range)}><SelectTrigger className="w-28" aria-label="Chart range"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="month">Month</SelectItem><SelectItem value="year">Year</SelectItem></SelectContent></Select>
      </div>
    </CardHeader>
    <CardContent>
      <ChartContainer config={{ value: { label, color: "var(--chart-1)" } }} className="h-72 w-full">
        <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 8 }}><CartesianGrid vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(value) => range === "year" ? value.slice(5) : value.slice(8)} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => metric === "revenue" ? `$${value}` : value} /><ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })} formatter={(value) => metric === "revenue" ? `$${Number(value).toLocaleString()}` : `${value} clients`} />} /><Bar dataKey="value" fill="var(--color-value)" radius={4} /></BarChart>
      </ChartContainer>
      {!events.length && <p className="mt-3 text-center text-sm text-muted-foreground">No scheduled activity for this period.</p>}
    </CardContent>
  </Card>
}
