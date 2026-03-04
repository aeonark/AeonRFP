'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Brain,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Shield,
    TrendingUp,
    FileText,
    Filter,
    Loader2,
    AlertCircle,
    RefreshCw,
    Inbox,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Types
// ============================================

interface Clause {
    id: string
    clause_index: number
    clause_text: string
    clause_type: 'technical' | 'compliance' | 'financial' | 'operational' | 'legal' | 'general'
    confidence_score: number | null
    generated_answer: string | null
    reasoning_summary: string | null
    risk_flag: 'low' | 'medium' | 'high' | null
    status: string
}

interface RFPDocument {
    id: string
    title: string
    status: string
    clause_count: number | null
    created_at: string
}

// ============================================
// Sub-components
// ============================================

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

    const confidence = clause.confidence_score ?? 0
    const riskFlag = clause.risk_flag ?? 'low'
    const clauseType = clause.clause_type || 'general'

    return (
        <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:border-border/60">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 text-left"
            >
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                        {clause.clause_index}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${typeColors[clauseType] || typeColors.general}`}>
                                {clauseType}
                            </span>
                            {riskFlag === 'high' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive">
                                    ⚠ High Risk
                                </span>
                            )}
                            {riskFlag === 'medium' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-chart-4/10 text-chart-4">
                                    ⚡ Medium Risk
                                </span>
                            )}
                            {clause.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground">
                                    Pending AI
                                </span>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed">{clause.clause_text}</p>
                        <div className="flex items-center gap-6 mt-3">
                            {confidence > 0 && (
                                <>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Brain className="w-3.5 h-3.5" />
                                        Confidence:
                                    </div>
                                    <ConfidenceMeter value={confidence} />
                                </>
                            )}
                            {clause.generated_answer && (
                                <div className="flex items-center gap-1.5 text-xs text-aeon-emerald">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    AI Response Ready
                                </div>
                            )}
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
                        {/* AI Reasoning */}
                        {clause.reasoning_summary && (
                            <div className="p-4 rounded-lg bg-aeon-blue/5 border border-aeon-blue/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-aeon-blue" />
                                    <span className="text-xs font-semibold text-aeon-blue uppercase tracking-wider">
                                        AI Reasoning
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {clause.reasoning_summary}
                                </p>
                            </div>
                        )}

                        {/* Generated Answer */}
                        {clause.generated_answer ? (
                            <div className="p-4 rounded-lg bg-secondary/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-aeon-emerald" />
                                    <span className="text-xs font-semibold text-aeon-emerald uppercase tracking-wider">
                                        Generated Response
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed">
                                    {clause.generated_answer}
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
                        ) : (
                            <div className="p-4 rounded-lg bg-secondary/30 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No AI response generated yet. Process this clause to generate a response.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================
// Main Page
// ============================================

export default function ClausesPage() {
    const [clauses, setClauses] = useState<Clause[]>([])
    const [rfps, setRFPs] = useState<RFPDocument[]>([])
    const [selectedRFP, setSelectedRFP] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<string>('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // -----------------------------------
    // Fetch available RFPs
    // -----------------------------------
    useEffect(() => {
        async function loadRFPs() {
            try {
                const { data, error: fetchError } = await supabase
                    .from('rfp_documents')
                    .select('id, title, status, clause_count, created_at')
                    .in('status', ['completed', 'processing'])
                    .order('created_at', { ascending: false })

                if (fetchError) throw fetchError

                const rfpList = (data || []) as RFPDocument[]
                setRFPs(rfpList)

                // Auto-select the first completed RFP
                if (rfpList.length > 0 && !selectedRFP) {
                    const firstCompleted = rfpList.find((r) => r.status === 'completed')
                    setSelectedRFP(firstCompleted?.id || rfpList[0].id)
                }
            } catch (err) {
                console.error('[clauses] Failed to load RFPs:', err)
                setError('Failed to load RFP documents')
            } finally {
                setLoading(false)
            }
        }

        loadRFPs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // -----------------------------------
    // Fetch clauses for selected RFP
    // -----------------------------------
    const fetchClauses = useCallback(async (rfpId: string) => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('clauses')
                .select('id, clause_index, clause_text, clause_type, confidence_score, generated_answer, reasoning_summary, risk_flag, status')
                .eq('rfp_id', rfpId)
                .order('clause_index', { ascending: true })

            if (fetchError) throw fetchError

            setClauses((data || []) as Clause[])
        } catch (err) {
            console.error('[clauses] Failed to load clauses:', err)
            setError('Failed to load clauses from database')
            setClauses([])
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (selectedRFP) {
            fetchClauses(selectedRFP)
        }
    }, [selectedRFP, fetchClauses])

    // -----------------------------------
    // Derived state
    // -----------------------------------
    const filtered =
        filterType === 'all'
            ? clauses
            : clauses.filter((c) => c.clause_type === filterType)

    const activeTypes = [...new Set(clauses.map((c) => c.clause_type || 'general'))]
    const avgConfidence = clauses.length > 0
        ? Math.round(clauses.reduce((sum, c) => sum + (c.confidence_score || 0), 0) / clauses.length)
        : 0
    const answeredCount = clauses.filter((c) => c.generated_answer).length

    const selectedRFPDoc = rfps.find((r) => r.id === selectedRFP)

    // -----------------------------------
    // Render
    // -----------------------------------
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Clause Intelligence</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        AI-analyzed clauses with confidence scores and suggested responses.
                    </p>
                </div>
                {selectedRFP && (
                    <button
                        onClick={() => fetchClauses(selectedRFP)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                )}
            </div>

            {/* RFP Selector */}
            {rfps.length > 0 && (
                <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedRFP || ''}
                        onChange={(e) => setSelectedRFP(e.target.value)}
                        className="flex-1 h-10 px-4 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all appearance-none cursor-pointer"
                    >
                        {rfps.map((rfp) => (
                            <option key={rfp.id} value={rfp.id}>
                                {rfp.title || `RFP #${rfp.id.slice(0, 8)}`}
                                {rfp.clause_count ? ` (${rfp.clause_count} clauses)` : ''}
                                {rfp.status === 'processing' ? ' — Processing' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Stats bar */}
            {clauses.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card rounded-xl p-3 text-center">
                        <div className="text-lg font-bold gradient-text">{clauses.length}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Clauses</div>
                    </div>
                    <div className="glass-card rounded-xl p-3 text-center">
                        <div className="text-lg font-bold gradient-text">{answeredCount}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Responses</div>
                    </div>
                    <div className="glass-card rounded-xl p-3 text-center">
                        <div className="text-lg font-bold gradient-text">{avgConfidence}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Confidence</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {clauses.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === 'all'
                            ? 'bg-aeon-blue/10 text-aeon-blue border border-aeon-blue/20'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        All Types
                    </button>
                    {activeTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === type
                                ? 'bg-aeon-blue/10 text-aeon-blue border border-aeon-blue/20'
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="glass-card rounded-2xl p-16 text-center">
                    <Loader2 className="w-8 h-8 text-aeon-blue animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                        Loading clauses{selectedRFPDoc ? ` for "${selectedRFPDoc.title || 'RFP'}"` : ''}...
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="glass-card rounded-2xl p-12 text-center border border-destructive/20">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
                    <p className="text-sm font-medium text-destructive mb-2">Error Loading Clauses</p>
                    <p className="text-xs text-muted-foreground mb-4">{error}</p>
                    {selectedRFP && (
                        <button
                            onClick={() => fetchClauses(selectedRFP)}
                            className="px-4 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && clauses.length === 0 && (
                <div className="glass-card rounded-2xl p-16 text-center">
                    <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">No Clauses Found</p>
                    <p className="text-xs text-muted-foreground">
                        {rfps.length === 0
                            ? 'Upload and process an RFP document to see clauses here.'
                            : 'This RFP has no extracted clauses yet. Try processing the document first.'}
                    </p>
                </div>
            )}

            {/* Clause list */}
            {!loading && !error && filtered.length > 0 && (
                <div className="space-y-4">
                    {filtered.map((clause) => (
                        <ClauseCard key={clause.id} clause={clause} />
                    ))}
                </div>
            )}

            {/* Filter yielded no results */}
            {!loading && !error && clauses.length > 0 && filtered.length === 0 && (
                <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No clauses match the &quot;{filterType}&quot; filter. Try &quot;All Types&quot;.
                    </p>
                </div>
            )}
        </div>
    )
}
