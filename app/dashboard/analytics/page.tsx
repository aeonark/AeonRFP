'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    FileText,
    TrendingUp,
    Clock,
    RefreshCw as Repeat,
    Target,
    CheckCircle2,
    Loader2,
    Inbox,
    Timer,
    AlertCircle,
} from 'lucide-react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Chart colors
// ============================================

const CLAUSE_COLORS: Record<string, string> = {
    technical:   'hsl(245, 80%, 67%)',
    compliance:  'hsl(160, 70%, 50%)',
    financial:   'hsl(40, 90%, 55%)',
    operational: 'hsl(190, 80%, 55%)',
    legal:       'hsl(280, 60%, 60%)',
    general:     'hsl(220, 10%, 60%)',
}

const STATUS_COLORS: Record<string, string> = {
    completed:  'hsl(160, 70%, 50%)',
    processing: 'hsl(245, 80%, 67%)',
    failed:     'hsl(0, 70%, 55%)',
    pending:    'hsl(220, 10%, 60%)',
    uploading:  'hsl(190, 80%, 55%)',
}

// ============================================
// Helpers
// ============================================

function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================
// Main Page
// ============================================

export default function AnalyticsPage() {
    const [rfps, setRfps] = useState<any[]>([])
    const [clauses, setClauses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        setError(null)
        try {
            const supabase = createClient()
            const [rfpsRes, clausesRes] = await Promise.all([
                supabase.from('rfp_documents').select('*').order('created_at', { ascending: true }),
                supabase.from('clauses').select('*'),
            ])
            if (rfpsRes.error) throw rfpsRes.error
            if (clausesRes.error) throw clausesRes.error
            setRfps(rfpsRes.data || [])
            setClauses(clausesRes.data || [])
            setLastRefresh(new Date())
        } catch (err: any) {
            setError(err?.message || 'Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    // -----------------------------------
    // Loading
    // -----------------------------------
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center py-32 animate-fade-in">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-aeon-blue animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading analytics…</p>
                </div>
            </div>
        )
    }

    // -----------------------------------
    // Error
    // -----------------------------------
    if (error) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center py-32 animate-fade-in">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">Failed to load analytics</p>
                    <p className="text-xs text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    // -----------------------------------
    // Empty state
    // -----------------------------------
    if (rfps.length === 0) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center py-32 animate-fade-in">
                <div className="text-center">
                    <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">No Data Yet</p>
                    <p className="text-xs text-muted-foreground mb-4">
                        Upload and process RFP documents to see analytics here.
                    </p>
                    <a
                        href="/dashboard/upload"
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-xs font-medium hover:shadow-lg transition-all"
                    >
                        Upload an RFP
                    </a>
                </div>
            </div>
        )
    }

    // -----------------------------------
    // Compute metrics from real data
    // -----------------------------------
    const totalRFPs = rfps.length
    const completedRFPs = rfps.filter((r) => r.status === 'completed').length
    const totalClauses = clauses.length
    const answeredClauses = clauses.filter((c) => c.generated_answer != null).length

    const clausesWithScore = clauses.filter((c) => c.confidence_score != null && c.confidence_score > 0)
    const avgConfidence = clausesWithScore.length > 0
        ? Math.round(clausesWithScore.reduce((s, c) => s + (c.confidence_score || 0), 0) / clausesWithScore.length)
        : null

    const completionRate = totalClauses > 0
        ? Math.round((answeredClauses / totalClauses) * 100)
        : 0

    // Hours saved: ~15 min per answered clause
    const hoursSaved = Math.round((answeredClauses * 15) / 60)

    // Avg processing time (seconds) between upload and completion
    const processedRFPs = rfps.filter((r) => r.status === 'completed' && r.updated_at && r.created_at)
    const avgProcessingMin = processedRFPs.length > 0
        ? Math.round(
            processedRFPs.reduce((sum, r) => {
                const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()
                return sum + diff / 60000
            }, 0) / processedRFPs.length
        )
        : null

    // -----------------------------------
    // Chart data
    // -----------------------------------

    // RFP uploads over time (line chart per day)
    const uploadsByDay: Record<string, number> = {}
    for (const rfp of rfps) {
        const day = formatDate(rfp.created_at)
        uploadsByDay[day] = (uploadsByDay[day] || 0) + 1
    }
    const uploadTrend = Object.entries(uploadsByDay).map(([date, count]) => ({ date, count })).slice(-14)

    // RFP status breakdown (pie)
    const statusCounts: Record<string, number> = {}
    for (const rfp of rfps) {
        const s = rfp.status || 'unknown'
        statusCounts[s] = (statusCounts[s] || 0) + 1
    }
    const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

    // Clause type breakdown (bar)
    const typeCounts: Record<string, number> = {}
    for (const c of clauses) {
        const t = c.clause_type || 'general'
        typeCounts[t] = (typeCounts[t] || 0) + 1
    }
    const typeBarData = Object.entries(typeCounts)
        .map(([type, count]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            count,
            rawType: type,
        }))
        .sort((a, b) => b.count - a.count)

    // Clause completion over time
    const answeredByDay: Record<string, { answered: number; total: number }> = {}
    for (const c of clauses) {
        const day = formatDate(c.created_at)
        if (!answeredByDay[day]) answeredByDay[day] = { answered: 0, total: 0 }
        answeredByDay[day].total++
        if (c.generated_answer) answeredByDay[day].answered++
    }
    const completionTrend = Object.entries(answeredByDay)
        .map(([date, d]) => ({ date, rate: Math.round((d.answered / d.total) * 100) }))
        .slice(-14)

    // -----------------------------------
    // Render
    // -----------------------------------
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Last updated {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
                >
                    <Repeat className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<FileText className="w-5 h-5 text-aeon-blue" />}
                    label="Total RFPs"
                    value={String(totalRFPs)}
                    detail={`${completedRFPs} completed`}
                    positive={completedRFPs > 0}
                />
                <StatCard
                    icon={<CheckCircle2 className="w-5 h-5 text-aeon-emerald" />}
                    label="Clauses Answered"
                    value={`${answeredClauses}/${totalClauses}`}
                    detail={totalClauses > 0 ? `${completionRate}% completion` : undefined}
                    positive={completionRate >= 50}
                />
                <StatCard
                    icon={<Target className="w-5 h-5 text-chart-4" />}
                    label="Avg Confidence"
                    value={avgConfidence !== null ? `${avgConfidence}%` : '—'}
                    detail={avgConfidence !== null
                        ? avgConfidence >= 80 ? 'Above target ✓' : 'Below 80% target'
                        : 'Generate clauses to see score'}
                    positive={avgConfidence !== null && avgConfidence >= 80}
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-aeon-cyan" />}
                    label="Avg Processing"
                    value={avgProcessingMin !== null ? `${avgProcessingMin}m` : '—'}
                    detail={avgProcessingMin !== null ? 'upload to complete' : 'No completed RFPs yet'}
                />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-2 gap-4">
                {/* Upload trend */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-base font-semibold mb-1">RFP Upload Activity</h3>
                    <p className="text-xs text-muted-foreground mb-5">Documents uploaded per day</p>
                    {uploadTrend.length > 1 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={uploadTrend}>
                                <defs>
                                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%"   stopColor="hsl(245, 80%, 67%)" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="hsl(245, 80%, 67%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: 'hsl(220, 20%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(v: number) => [v, 'Uploads']}
                                />
                                <Area type="monotone" dataKey="count" stroke="hsl(245, 80%, 67%)" strokeWidth={2} fill="url(#uploadGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <SingleRFPBar rfps={rfps} />
                    )}
                </div>

                {/* Clause types */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-base font-semibold mb-1">Clause Types</h3>
                    <p className="text-xs text-muted-foreground mb-5">Distribution by category</p>
                    {typeBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={typeBarData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                                <XAxis dataKey="type" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: 'hsl(220, 20%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(v: number) => [v, 'Clauses']}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {typeBarData.map((entry) => (
                                        <Cell
                                            key={entry.type}
                                            fill={CLAUSE_COLORS[entry.rawType] || CLAUSE_COLORS.general}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                            No clause data yet — upload and process an RFP.
                        </div>
                    )}
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-2 gap-4">
                {/* RFP status breakdown */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-base font-semibold mb-1">RFP Status Breakdown</h3>
                    <p className="text-xs text-muted-foreground mb-5">Processing state across all documents</p>
                    {statusPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={statusPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                >
                                    {statusPieData.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={STATUS_COLORS[entry.name] || 'hsl(220, 10%, 60%)'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'hsl(220, 20%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Legend
                                    formatter={(value) => (
                                        <span style={{ color: 'hsl(220, 10%, 70%)', fontSize: 11 }}>
                                            {value.charAt(0).toUpperCase() + value.slice(1)}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                            No RFPs found.
                        </div>
                    )}
                </div>

                {/* Clause completion trend */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-base font-semibold mb-1">Clause Completion Rate</h3>
                    <p className="text-xs text-muted-foreground mb-5">% of clauses with AI responses over time</p>
                    {completionTrend.length > 1 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={completionTrend}>
                                <defs>
                                    <linearGradient id="complGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%"   stopColor="hsl(160, 70%, 50%)" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="hsl(160, 70%, 50%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{ background: 'hsl(220, 20%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(v: number) => [`${v}%`, 'Completion']}
                                />
                                <Area type="monotone" dataKey="rate" stroke="hsl(160, 70%, 50%)" strokeWidth={2} fill="url(#complGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                            {clauses.length === 0
                                ? 'No clauses processed yet.'
                                : `${completionRate}% of clauses answered (${answeredClauses}/${totalClauses})`}
                        </div>
                    )}
                </div>
            </div>

            {/* Time saved banner */}
            {hoursSaved > 0 && (
                <div className="glass-card rounded-xl p-6 flex items-center gap-4 bg-gradient-to-r from-aeon-blue/5 to-aeon-violet/5 border-aeon-blue/10">
                    <div className="w-12 h-12 rounded-xl bg-aeon-blue/10 flex items-center justify-center shrink-0">
                        <Timer className="w-6 h-6 text-aeon-blue" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold gradient-text">{hoursSaved} Hours Saved</div>
                        <p className="text-xs text-muted-foreground">
                            Estimated time saved by AI-generated responses across {answeredClauses} clauses
                            (~15 min per clause vs manual drafting)
                        </p>
                    </div>
                    {avgConfidence !== null && (
                        <div className="ml-auto text-right shrink-0">
                            <div className={`text-2xl font-bold ${avgConfidence >= 80 ? 'text-aeon-emerald' : 'text-chart-4'}`}>
                                {avgConfidence}%
                            </div>
                            <div className="text-xs text-muted-foreground">avg confidence</div>
                        </div>
                    )}
                </div>
            )}

            {/* Recent RFPs table */}
            <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Documents
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-muted-foreground border-b border-border/50">
                                <th className="text-left pb-2 font-medium">Name</th>
                                <th className="text-left pb-2 font-medium">Status</th>
                                <th className="text-left pb-2 font-medium">Clauses</th>
                                <th className="text-left pb-2 font-medium">Uploaded</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {rfps.slice(-10).reverse().map((rfp) => (
                                <tr key={rfp.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="py-2.5 pr-4 font-medium truncate max-w-[200px]">
                                        {rfp.name || `RFP #${rfp.id.slice(0, 8)}`}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        <span className={`px-2 py-0.5 rounded-full font-medium ${rfp.status === 'completed' ? 'bg-aeon-emerald/10 text-aeon-emerald' :
                                            rfp.status === 'processing' ? 'bg-aeon-blue/10 text-aeon-blue' :
                                            rfp.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                                            'bg-muted text-muted-foreground'}`}>
                                            {rfp.status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-4 text-muted-foreground">
                                        {rfp.clause_count ?? '—'}
                                    </td>
                                    <td className="py-2.5 text-muted-foreground">
                                        {formatDate(rfp.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Single RFP fallback bar (when only 1 upload)
// ============================================

function SingleRFPBar({ rfps }: { rfps: any[] }) {
    const statuses = ['completed', 'processing', 'failed', 'pending']
    const counts = statuses.map((s) => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        count: rfps.filter((r) => r.status === s).length,
    })).filter((s) => s.count > 0)

    return (
        <div className="h-[200px] flex flex-col justify-center gap-3">
            {counts.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                    <span className="w-20 text-[11px] text-muted-foreground text-right">{s.name}</span>
                    <div className="flex-1 h-5 rounded-full bg-secondary overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${(s.count / rfps.length) * 100}%`,
                                background: STATUS_COLORS[s.name.toLowerCase()] || 'hsl(220, 10%, 60%)',
                            }}
                        />
                    </div>
                    <span className="text-[11px] font-medium w-4">{s.count}</span>
                </div>
            ))}
        </div>
    )
}

// ============================================
// Stat Card
// ============================================

function StatCard({
    icon, label, value, detail, positive,
}: {
    icon: React.ReactNode
    label: string
    value: string
    detail?: string
    positive?: boolean
}) {
    return (
        <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-xs text-muted-foreground leading-tight">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {detail && (
                <div className={`text-xs mt-1 ${positive ? 'text-aeon-emerald' : 'text-muted-foreground'}`}>
                    {detail}
                </div>
            )}
        </div>
    )
}
