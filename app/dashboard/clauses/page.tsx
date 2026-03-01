'use client'

import { useState } from 'react'
import {
    Brain,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Shield,
    TrendingUp,
    FileText,
    Filter,
} from 'lucide-react'

interface Clause {
    id: string
    index: number
    text: string
    type: 'technical' | 'compliance' | 'financial' | 'operational' | 'legal' | 'general'
    similarity: number
    confidence: number
    suggestedAnswer: string
    reasoning: string
    riskFlag: 'low' | 'medium' | 'high'
    matchCount: number
}

const mockClauses: Clause[] = [
    {
        id: '1',
        index: 1,
        text: 'The vendor shall demonstrate compliance with NIST SP 800-53 Rev 5 security controls, including continuous monitoring capabilities.',
        type: 'compliance',
        similarity: 0.94,
        confidence: 92,
        suggestedAnswer: 'Our organization maintains full compliance with NIST SP 800-53 Rev 5 security controls. We implement continuous monitoring through our proprietary Security Operations Center (SOC), which operates 24/7/365 with automated alerting and response capabilities. Our compliance posture is validated through annual third-party audits conducted by certified assessors.',
        reasoning: 'High confidence based on 3 strong historical matches. Previous compliance responses well-documented.',
        riskFlag: 'low',
        matchCount: 3,
    },
    {
        id: '2',
        index: 2,
        text: 'Describe your approach to data encryption at rest and in transit, including key management procedures.',
        type: 'technical',
        similarity: 0.88,
        confidence: 87,
        suggestedAnswer: 'We employ AES-256 encryption for all data at rest and TLS 1.3 for data in transit. Our key management leverages AWS KMS with automated key rotation on a 90-day cycle. All encryption keys are stored in FIPS 140-2 Level 3 validated hardware security modules (HSMs).',
        reasoning: 'Good match against 2 previous technical responses. Key management details partially inferred.',
        riskFlag: 'low',
        matchCount: 2,
    },
    {
        id: '3',
        index: 3,
        text: 'Provide detailed pricing for a 3-year engagement including all licensing, support, and maintenance costs.',
        type: 'financial',
        similarity: 0.62,
        confidence: 54,
        suggestedAnswer: 'Our 3-year engagement pricing is structured as follows: Year 1 includes licensing and implementation, Years 2-3 include annual licensing renewal and standard support. Detailed pricing is provided in the attached cost matrix. Volume discounts are available for multi-year commitments.',
        reasoning: 'Low confidence — financial terms vary significantly. Only 1 partial match found. Manual review recommended.',
        riskFlag: 'high',
        matchCount: 1,
    },
    {
        id: '4',
        index: 4,
        text: 'Describe your disaster recovery and business continuity plan, including RTO and RPO targets.',
        type: 'operational',
        similarity: 0.91,
        confidence: 89,
        suggestedAnswer: 'Our disaster recovery plan provides RTO of 4 hours and RPO of 1 hour for critical systems. We maintain geographically distributed redundant infrastructure across three AWS regions. Automated failover is tested quarterly through full DR exercises, with results documented and provided upon request.',
        reasoning: 'Strong historical matches from previous operational responses. DR documentation well-maintained.',
        riskFlag: 'low',
        matchCount: 3,
    },
]

const typeColors: Record<string, string> = {
    technical: 'bg-aeon-blue/10 text-aeon-blue',
    compliance: 'bg-aeon-emerald/10 text-aeon-emerald',
    financial: 'bg-chart-4/10 text-chart-4',
    operational: 'bg-aeon-cyan/10 text-aeon-cyan',
    legal: 'bg-aeon-violet/10 text-aeon-violet',
    general: 'bg-muted text-muted-foreground',
}

function ConfidenceMeter({ value }: { value: number }) {
    const color =
        value >= 80 ? 'bg-aeon-emerald' : value >= 60 ? 'bg-chart-4' : 'bg-destructive'
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-xs font-medium w-8">{value}%</span>
        </div>
    )
}

function ClauseCard({ clause }: { clause: Clause }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:border-border/60">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 text-left"
            >
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                        {clause.index}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${typeColors[clause.type]}`}>
                                {clause.type}
                            </span>
                            {clause.riskFlag === 'high' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive">
                                    ⚠ High Risk
                                </span>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed">{clause.text}</p>
                        <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Similarity: {Math.round(clause.similarity * 100)}%
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Brain className="w-3.5 h-3.5" />
                                Confidence:
                            </div>
                            <ConfidenceMeter value={clause.confidence} />
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <FileText className="w-3.5 h-3.5" />
                                {clause.matchCount} matches
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 p-1 text-muted-foreground">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="px-5 pb-5 pt-0 border-t border-border/30 mt-0">
                    <div className="pt-4 space-y-4">
                        {/* AI Explanation */}
                        <div className="p-4 rounded-lg bg-aeon-blue/5 border border-aeon-blue/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="w-4 h-4 text-aeon-blue" />
                                <span className="text-xs font-semibold text-aeon-blue uppercase tracking-wider">
                                    AI Reasoning
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {clause.reasoning}
                            </p>
                        </div>

                        {/* Suggested Answer */}
                        <div className="p-4 rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-aeon-emerald" />
                                <span className="text-xs font-semibold text-aeon-emerald uppercase tracking-wider">
                                    Suggested Response
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                {clause.suggestedAnswer}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-aeon-blue text-white text-xs font-medium hover:bg-aeon-blue/90 transition-colors">
                                    Use Response
                                </button>
                                <button className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors">
                                    Edit in Draft
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ClausesPage() {
    const [filterType, setFilterType] = useState<string>('all')
    const filtered =
        filterType === 'all'
            ? mockClauses
            : mockClauses.filter((c) => c.type === filterType)

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Clause Intelligence</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        AI-analyzed clauses with similarity scores, confidence, and suggested responses.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {['all', 'technical', 'compliance', 'financial', 'operational', 'legal'].map(
                    (type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === type
                                    ? 'bg-aeon-blue/10 text-aeon-blue border border-aeon-blue/20'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {type === 'all' ? 'All Types' : type}
                        </button>
                    )
                )}
            </div>

            {/* Clause list */}
            <div className="space-y-4">
                {filtered.map((clause) => (
                    <ClauseCard key={clause.id} clause={clause} />
                ))}
            </div>
        </div>
    )
}
