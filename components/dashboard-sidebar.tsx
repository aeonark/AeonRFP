"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Upload,
  Activity,
  Brain,
  FileEdit,
  BarChart3,
  FileText,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Upload RFP",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    label: "Processing",
    href: "/dashboard/processing",
    icon: Activity,
  },
  {
    label: "Clause Intelligence",
    href: "/dashboard/clauses",
    icon: Brain,
  },
  {
    label: "Draft Editor",
    href: "/dashboard/editor",
    icon: FileEdit,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
          <FileText className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          AeonRFP
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
