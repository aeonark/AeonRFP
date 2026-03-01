'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Sparkles,
    Upload,
    Brain,
    FileEdit,
    BarChart3,
    Settings,
    Home,
    Loader,
    Mail,
    Database,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/dashboard/upload', label: 'Upload RFP', icon: Upload },
    { href: '/dashboard/processing', label: 'Processing', icon: Loader },
    { href: '/dashboard/clauses', label: 'Clause Intelligence', icon: Brain },
    { href: '/dashboard/editor', label: 'Draft Editor', icon: FileEdit },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/knowledge', label: 'Knowledge Vault', icon: Database },
    { href: '/dashboard/gmail', label: 'Gmail Inbox', icon: Mail },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'h-screen sticky top-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
                collapsed ? 'w-[68px]' : 'w-[240px]'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aeon-blue to-aeon-violet flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                            AeonRFP
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-sidebar-primary/10 text-sidebar-primary'
                                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className="w-[18px] h-[18px] shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-sidebar-border">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>
        </aside>
    )
}
