'use client'

import Link from 'next/link'
import {
    Upload,
    Brain,
    FileEdit,
    BarChart3,
    TrendingUp,
    Clock,
    FileText,
    Zap,
    ArrowUpRight,
} from 'lucide-react'

const stats = [
    { label: 'Active RFPs', value: '12', change: '+3 this week', icon: FileText, color: 'text-aeon-blue' },
    { label: 'Win Rate', value: '78%', change: '+5% vs last month', icon: TrendingUp, color: 'text-aeon-emerald' },
    { label: 'Avg Confidence', value: '91%', change: 'Above target', icon: Zap, color: 'text-aeon-violet' },
    { label: 'Avg Response Time', value: '2.4h', change: '-40% improvement', icon: Clock, color: 'text-aeon-cyan' },
]

const recentRfps = [
    { name: 'DOD Cybersecurity Framework RFP', status: 'completed', clauses: 47, confidence: 92, date: '2h ago' },
    { name: 'Healthcare IT Modernization', status: 'processing', clauses: 31, confidence: 0, date: '4h ago' },
    { name: 'Federal Cloud Migration Tender', status: 'completed', clauses: 58, confidence: 88, date: '1d ago' },
    { name: 'Smart City Infrastructure RFI', status: 'draft', clauses: 23, confidence: 76, date: '2d ago' },
]

const quickActions = [
    { label: 'Upload RFP', href: '/dashboard/upload', icon: Upload, desc: 'Drag & drop a new document' },
    { label: 'Clause Intelligence', href: '/dashboard/clauses', icon: Brain, desc: 'Review matched clauses' },
    { label: 'Draft Editor', href: '/dashboard/editor', icon: FileEdit, desc: 'Continue editing responses' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, desc: 'View performance metrics' },
]

function statusBadge(status: string) {
    const styles: Record<string, string> = {
        completed: 'bg-aeon-emerald/10 text-aeon-emerald',
        processing: 'bg-aeon-blue/10 text-aeon-blue',
        draft: 'bg-muted text-muted-foreground',
    }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
            {status}
        </span>
    )
}

export default function DashboardOverview() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Welcome back. Here&apos;s your proposal intelligence overview.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="glass-card rounded-xl p-5 hover:border-border/60 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center`}>
                                <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                        <div className="text-xs text-aeon-emerald mt-2">{stat.change}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="glass-card rounded-xl p-5 hover:border-aeon-blue/30 hover:scale-[1.02] transition-all duration-200 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-aeon-blue/10 flex items-center justify-center mb-3 group-hover:bg-aeon-blue/15 transition-colors">
                                <action.icon className="w-5 h-5 text-aeon-blue" />
                            </div>
                            <div className="text-sm font-semibold">{action.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{action.desc}</div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent RFPs */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent RFPs</h2>
                    <Link
                        href="/dashboard/processing"
                        className="text-xs text-aeon-blue hover:underline"
                    >
                        View all →
                    </Link>
                </div>
                <div className="glass-card rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Clauses</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Confidence</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRfps.map((rfp) => (
                                <tr
                                    key={rfp.name}
                                    className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                                >
                                    <td className="px-5 py-4 text-sm font-medium">{rfp.name}</td>
                                    <td className="px-5 py-4">{statusBadge(rfp.status)}</td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfp.clauses}</td>
                                    <td className="px-5 py-4">
                                        {rfp.confidence > 0 ? (
                                            <span className="text-sm font-medium">{rfp.confidence}%</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfp.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
