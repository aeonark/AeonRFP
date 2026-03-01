'use client'

import {
    BarChart3,
    TrendingUp,
    Clock,
    Target,
    Award,
    FileText,
    Repeat,
} from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell,
} from 'recharts'

const winRateData = [
    { month: 'Aug', rate: 62 },
    { month: 'Sep', rate: 68 },
    { month: 'Oct', rate: 65 },
    { month: 'Nov', rate: 72 },
    { month: 'Dec', rate: 74 },
    { month: 'Jan', rate: 78 },
    { month: 'Feb', rate: 82 },
]

const clauseReuseData = [
    { type: 'Technical', count: 145, color: '#6B8AFF' },
    { type: 'Compliance', count: 112, color: '#34D399' },
    { type: 'Financial', count: 67, color: '#FBBF24' },
    { type: 'Operational', count: 98, color: '#67E8F9' },
    { type: 'Legal', count: 54, color: '#A78BFA' },
    { type: 'General', count: 89, color: '#94A3B8' },
]

const performanceMetrics = [
    { label: 'Total RFPs Processed', value: '87', icon: FileText, change: '+12 this month' },
    { label: 'Avg Win Rate', value: '78%', icon: TrendingUp, change: '+6% trend' },
    { label: 'Avg Response Time', value: '2.4h', icon: Clock, change: '40% faster' },
    { label: 'Clause Reuse Rate', value: '64%', icon: Repeat, change: 'High efficiency' },
    { label: 'Avg Confidence Score', value: '91%', icon: Target, change: 'Above target' },
    { label: 'Top Performer', value: 'Compliance', icon: Award, change: '94% accuracy' },
]

const customTooltipStyle = {
    backgroundColor: 'oklch(0.15 0.01 260)',
    border: '1px solid oklch(0.25 0.02 260)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: 'oklch(0.90 0.01 260)',
}

export default function AnalyticsPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Performance insights across your RFP portfolio.
                </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {performanceMetrics.map((metric) => (
                    <div key={metric.label} className="glass-card rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                                <metric.icon className="w-[18px] h-[18px] text-aeon-blue" />
                            </div>
                            <span className="text-xs text-muted-foreground">{metric.label}</span>
                        </div>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <div className="text-xs text-aeon-emerald mt-1">{metric.change}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Win Rate Trend */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-sm font-semibold mb-1">Win Rate Trend</h3>
                    <p className="text-xs text-muted-foreground mb-6">
                        Monthly proposal win rate over the last 7 months
                    </p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={winRateData}>
                                <defs>
                                    <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6B8AFF" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#6B8AFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, fill: 'oklch(0.60 0.01 260)' }}
                                    axisLine={{ stroke: 'oklch(0.25 0.02 260)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[50, 100]}
                                    tick={{ fontSize: 11, fill: 'oklch(0.60 0.01 260)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`${v}%`, 'Win Rate']} />
                                <Area
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#6B8AFF"
                                    strokeWidth={2}
                                    fill="url(#winRateGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Clause Reuse Heatmap (Bar chart) */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-sm font-semibold mb-1">Clause Reuse by Type</h3>
                    <p className="text-xs text-muted-foreground mb-6">
                        How often each clause type is reused from knowledge vault
                    </p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={clauseReuseData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" />
                                <XAxis
                                    dataKey="type"
                                    tick={{ fontSize: 10, fill: 'oklch(0.60 0.01 260)' }}
                                    axisLine={{ stroke: 'oklch(0.25 0.02 260)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'oklch(0.60 0.01 260)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {clauseReuseData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={entry.color} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Time saved callout */}
            <div className="glass-card rounded-xl p-8 text-center gradient-border">
                <div className="text-4xl font-bold gradient-text mb-2">18 Hours</div>
                <div className="text-sm text-muted-foreground">
                    Estimated time saved this month using AeonRFP AI-powered drafting
                </div>
            </div>
        </div>
    )
}
