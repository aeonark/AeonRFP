'use client'

import { useState, useEffect } from 'react'
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
    Inbox,
} from 'lucide-react'
import { getRFPs, getAllClauses, invalidateCache } from '@/lib/store/local-store'
import type { StoredRFP } from '@/lib/store/local-store'

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
        failed: 'bg-destructive/10 text-destructive',
        uploaded: 'bg-muted text-muted-foreground',
    }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.uploaded}`}>
            {status}
        </span>
    )
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export default function DashboardOverview() {
    const [rfps, setRFPs] = useState<StoredRFP[]>([])
    const [stats, setStats] = useState({
        totalRFPs: 0,
        totalClauses: 0,
        avgConfidence: 0,
        answeredClauses: 0,
    })

    useEffect(() => {
        invalidateCache()
        const rfpList = getRFPs()
        const allClauses = getAllClauses()

        setRFPs(rfpList)

        const clausesWithConfidence = allClauses.filter(
            (c) => c.confidence_score != null && c.confidence_score > 0
        )
        const avgConf = clausesWithConfidence.length > 0
            ? Math.round(clausesWithConfidence.reduce((s, c) => s + (c.confidence_score || 0), 0) / clausesWithConfidence.length)
            : 0

        setStats({
            totalRFPs: rfpList.length,
            totalClauses: allClauses.length,
            avgConfidence: avgConf,
            answeredClauses: allClauses.filter((c) => c.generated_answer != null).length,
        })
    }, [])

    const statCards = [
        { label: 'Active RFPs', value: String(stats.totalRFPs), change: `${stats.totalClauses} clauses total`, icon: FileText, color: 'text-aeon-blue' },
        { label: 'Win Rate', value: stats.avgConfidence > 0 ? `${Math.round((stats.avgConfidence / 100) * 100)}%` : '—', change: stats.avgConfidence >= 80 ? 'Above target' : stats.avgConfidence > 0 ? 'Building data' : 'Upload RFPs to start', icon: TrendingUp, color: 'text-aeon-emerald' },
        { label: 'Avg Confidence', value: stats.avgConfidence > 0 ? `${stats.avgConfidence}%` : '—', change: stats.avgConfidence >= 80 ? 'Above target' : '', icon: Zap, color: 'text-aeon-violet' },
        { label: 'AI Responses', value: String(stats.answeredClauses), change: stats.totalClauses > 0 ? `${Math.round((stats.answeredClauses / stats.totalClauses) * 100)}% coverage` : '', icon: Clock, color: 'text-aeon-cyan' },
    ]

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
                {statCards.map((stat) => (
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
                        {stat.change && (
                            <div className="text-xs text-aeon-emerald mt-2">{stat.change}</div>
                        )}
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
                        href="/dashboard/upload"
                        className="text-xs text-aeon-blue hover:underline"
                    >
                        Upload new →
                    </Link>
                </div>
                {rfps.length > 0 ? (
                    <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Clauses</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rfps.slice(0, 5).map((rfp) => (
                                    <tr
                                        key={rfp.id}
                                        className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium">{rfp.title}</td>
                                        <td className="px-5 py-4">{statusBadge(rfp.status)}</td>
                                        <td className="px-5 py-4 text-sm text-muted-foreground">{rfp.clause_count ?? '—'}</td>
                                        <td className="px-5 py-4 text-sm text-muted-foreground">{timeAgo(rfp.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="glass-card rounded-xl p-12 text-center">
                        <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium mb-1">No RFPs yet</p>
                        <p className="text-xs text-muted-foreground mb-4">Upload your first RFP document to get started.</p>
                        <Link
                            href="/dashboard/upload"
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-xs font-medium hover:shadow-lg transition-all"
                        >
                            Upload an RFP
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
