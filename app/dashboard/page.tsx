import Link from "next/link"
import {
  Upload,
  Brain,
  FileEdit,
  BarChart3,
  ArrowRight,
  FileText,
  Activity,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const quickActions = [
  {
    title: "Upload RFP",
    description: "Upload a new RFP document for AI analysis",
    icon: Upload,
    href: "/dashboard/upload",
  },
  {
    title: "Processing Status",
    description: "Check the status of your RFP processing pipeline",
    icon: Activity,
    href: "/dashboard/processing",
  },
  {
    title: "Clause Intelligence",
    description: "Review extracted clauses and AI insights",
    icon: Brain,
    href: "/dashboard/clauses",
  },
  {
    title: "Draft Editor",
    description: "Edit and finalize your AI-generated proposal drafts",
    icon: FileEdit,
    href: "/dashboard/editor",
  },
  {
    title: "Analytics",
    description: "View win rates, performance metrics, and trends",
    icon: BarChart3,
    href: "/dashboard/analytics",
  },
]

const recentActivity = [
  {
    title: "Enterprise SaaS RFP",
    status: "Completed",
    date: "2 hours ago",
    statusColor: "bg-green-500",
  },
  {
    title: "Government IT Services RFP",
    status: "Processing",
    date: "5 hours ago",
    statusColor: "bg-accent",
  },
  {
    title: "Healthcare Platform RFP",
    status: "Draft Ready",
    date: "1 day ago",
    statusColor: "bg-primary",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your RFPs and track proposal performance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active RFPs", value: "12", icon: FileText },
          { label: "Clauses Extracted", value: "847", icon: Brain },
          { label: "Drafts Generated", value: "34", icon: FileEdit },
          { label: "Win Rate", value: "68%", icon: BarChart3 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group h-full transition-all hover:border-primary/30 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="text-base text-card-foreground">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {recentActivity.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${item.statusColor}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
