import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { Users, DollarSign, CreditCard, TrendingUp } from "lucide-react"

export default function AdminPage() {
  const stats = {
    totalUsers: 1247,
    mrr: 2850,
    activeSubscribers: 189,
    growth: 12.5
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your application metrics
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats.mrr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscribers</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activeSubscribers}</div>
              <p className="text-xs text-muted-foreground">Paid subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">+{stats.growth}%</div>
              <p className="text-xs text-muted-foreground">From last month</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user signups and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {[
                { name: "Jessica R.", plan: "Pro", date: "Apr 21, 2026" },
                { name: "Dana K.", plan: "Free", date: "Apr 20, 2026" },
                { name: "Maria S.", plan: "Pro Plus", date: "Apr 19, 2026" },
                { name: "Carla M.", plan: "Pro", date: "Apr 18, 2026" },
                { name: "Tanya B.", plan: "Free", date: "Apr 17, 2026" },
              ].map((u) => (
                <div key={u.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={u.plan === "Free"
                      ? "rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                      : "rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                    }>
                      {u.plan}
                    </span>
                    <span className="text-xs text-muted-foreground">{u.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
