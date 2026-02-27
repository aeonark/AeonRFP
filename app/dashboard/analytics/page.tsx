"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const winRateData = [
  { month: "Jul", rate: 52 },
  { month: "Aug", rate: 58 },
  { month: "Sep", rate: 55 },
  { month: "Oct", rate: 63 },
  { month: "Nov", rate: 67 },
  { month: "Dec", rate: 64 },
  { month: "Jan", rate: 71 },
  { month: "Feb", rate: 68 },
]

const clauseReuseData = [
  { category: "Security", reuse: 89, count: 23 },
  { category: "SLA", reuse: 76, count: 18 },
  { category: "Technical", reuse: 64, count: 31 },
  { category: "Compliance", reuse: 82, count: 15 },
  { category: "Pricing", reuse: 45, count: 22 },
  { category: "Legal", reuse: 71, count: 12 },
]

const proposalStatusData = [
  { name: "Won", value: 34, color: "hsl(142, 70%, 45%)" },
  { name: "Pending", value: 12, color: "hsl(220, 70%, 55%)" },
  { name: "Lost", value: 16, color: "hsl(0, 70%, 55%)" },
]

const kpis = [
  { label: "Total Proposals", value: "62", change: "+12% vs last quarter" },
  { label: "Avg. Response Time", value: "3.2 days", change: "-42% improvement" },
  { label: "Clause Accuracy", value: "89%", change: "+5% vs last quarter" },
  { label: "Revenue Influenced", value: "$4.2M", change: "+28% vs last quarter" },
]

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your proposal performance, win rates, and AI-powered insights.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-card-foreground">
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-xs font-medium text-accent">
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Win rate chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Win Rate Trend
            </CardTitle>
            <CardDescription>Monthly win rate over the last 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    domain={[40, 80]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value}%`, "Win Rate"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Proposal status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Proposal Outcomes
            </CardTitle>
            <CardDescription>Distribution of proposal results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proposalStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {proposalStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clause reuse heatmap as bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Clause Reuse by Category
            </CardTitle>
            <CardDescription>
              How often clause templates are reused across proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clauseReuseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      name === "reuse" ? `${value}%` : value,
                      name === "reuse" ? "Reuse Rate" : "Total Clauses",
                    ]}
                  />
                  <Bar dataKey="reuse" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
