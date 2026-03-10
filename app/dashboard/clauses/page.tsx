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
import { isSupabasePlaceholder } from '@/lib/supabase/is-placeholder'

// ============================================
// Demo data (used when Supabase is not configured)
// ============================================

const DEMO_RFPS: RFPDocument[] = [
    { id: 'demo-rfp-1', title: 'DOD Cybersecurity Framework RFP', status: 'completed', clause_count: 8, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'demo-rfp-2', title: 'Healthcare IT Modernization', status: 'processing', clause_count: 5, created_at: new Date(Date.now() - 14400000).toISOString() },
]

const DEMO_CLAUSES: Record<string, Clause[]> = {
    'demo-rfp-1': [
        {
            id: 'c1', clause_index: 1, clause_type: 'compliance',
            clause_text: 'The contractor shall comply with NIST SP 800-171 Rev 2 for all Controlled Unclassified Information (CUI) handling, storage, and transmission across all systems.',
            confidence_score: 94, risk_flag: 'low', status: 'complete',
            generated_answer: 'Aeonark Labs maintains full compliance with NIST SP 800-171 Rev 2. Our infrastructure implements all 110 security requirements across 14 control families. We conduct annual third-party assessments and maintain a current System Security Plan (SSP) and Plan of Action & Milestones (POA&M). All CUI is encrypted at rest (AES-256) and in transit (TLS 1.3).',
            reasoning_summary: 'High confidence — direct policy match from knowledge base with 3 prior winning responses referencing NIST 800-171 compliance.',
        },
        {
            id: 'c2', clause_index: 2, clause_type: 'technical',
            clause_text: 'The solution must provide real-time threat detection with sub-second response capabilities and integrate with existing SIEM infrastructure via standard protocols.',
            confidence_score: 87, risk_flag: 'medium', status: 'complete',
            generated_answer: 'Our platform features AI-powered threat detection with average response times of 200ms. We support native integration with Splunk, QRadar, and Microsoft Sentinel via CEF/LEEF syslog and REST API connectors. Our detection engine processes 50,000+ events per second with a 99.7% true positive rate.',
            reasoning_summary: 'Good match from technical capabilities brief. Medium risk flagged due to sub-second requirement — our avg 200ms meets it but edge cases may exceed.',
        },
        {
            id: 'c3', clause_index: 3, clause_type: 'financial',
            clause_text: 'Provide a detailed cost breakdown including licensing, implementation, training, and 3-year total cost of ownership (TCO) for a 10,000-user deployment.',
            confidence_score: 72, risk_flag: 'medium', status: 'complete',
            generated_answer: 'Year 1: $2.4M (licensing: $1.8M, implementation: $400K, training: $200K). Year 2-3: $1.9M/year (licensing: $1.6M, support: $300K). 3-Year TCO: $6.2M or $207/user/year. Volume discounts of 15% available for 3-year commitment. Implementation includes 90-day deployment with dedicated project manager.',
            reasoning_summary: 'Moderate confidence — pricing aligned with historical proposals but 10K user scale is new territory. Costs extrapolated from 5K-user baseline.',
        },
        {
            id: 'c4', clause_index: 4, clause_type: 'operational',
            clause_text: 'The vendor shall maintain 99.99% uptime SLA with defined penalties for non-compliance, including service credits and escalation procedures.',
            confidence_score: 91, risk_flag: 'low', status: 'complete',
            generated_answer: 'Aeonark Labs guarantees 99.99% uptime (52.56 minutes max downtime/year) backed by our enterprise SLA. Service credits: 10% for 99.95-99.99%, 25% for 99.9-99.95%, 50% for below 99.9%. Escalation: L1 within 15 min, L2 within 1 hour, VP-level within 4 hours. Our trailing 12-month uptime is 99.997%.',
            reasoning_summary: 'High confidence — SLA template directly matches our standard enterprise terms with strong historical performance data.',
        },
        {
            id: 'c5', clause_index: 5, clause_type: 'compliance',
            clause_text: 'All personnel with access to government systems must hold active Secret clearance. Provide evidence of facility clearance level.',
            confidence_score: 88, risk_flag: 'low', status: 'complete',
            generated_answer: 'Aeonark Labs holds a Facility Clearance Level (FCL) of Secret. 100% of our government-facing engineering team maintains active Secret clearances (42 personnel). Our FSO manages continuous vetting through DCSA. Clearance verification available upon request through the DISS system.',
            reasoning_summary: 'Strong match — clearance data verified against company capability statements and prior proposals.',
        },
        {
            id: 'c6', clause_index: 6, clause_type: 'technical',
            clause_text: 'The system must support FedRAMP High authorization baseline and operate within an AWS GovCloud or equivalent IL5 environment.',
            confidence_score: 82, risk_flag: 'low', status: 'complete',
            generated_answer: 'Our platform is currently FedRAMP High authorized (package ID: FR2024-0847). We operate exclusively on AWS GovCloud (US) regions us-gov-west-1 and us-gov-east-1, meeting IL5 requirements. All data sovereignty controls are in place with no data leaving US jurisdictional boundaries.',
            reasoning_summary: 'High confidence — FedRAMP authorization is current. Matched against compliance documentation and 2 prior IL5 deployment proposals.',
        },
        {
            id: 'c7', clause_index: 7, clause_type: 'legal',
            clause_text: 'The contractor agrees to indemnify the Government against all claims arising from intellectual property infringement related to the delivered solution.',
            confidence_score: 78, risk_flag: 'high', status: 'complete',
            generated_answer: 'Aeonark Labs provides standard IP indemnification for all proprietary components of our solution. We warrant that our software does not infringe upon any third-party patents, copyrights, or trade secrets. Our indemnification covers legal defense costs and damages up to the total contract value. Open-source components are documented with compatible licenses (MIT, Apache 2.0).',
            reasoning_summary: 'Good confidence but flagged high risk — IP indemnification scope should be reviewed by legal. Standard language used from prior contracts.',
        },
        {
            id: 'c8', clause_index: 8, clause_type: 'operational',
            clause_text: 'Provide a detailed transition plan for knowledge transfer at contract conclusion, ensuring zero disruption to ongoing operations.',
            confidence_score: 65, risk_flag: 'medium', status: 'pending',
            generated_answer: null,
            reasoning_summary: null,
        },
    ],
    'demo-rfp-2': [
        {
            id: 'c9', clause_index: 1, clause_type: 'technical',
            clause_text: 'The system must support HL7 FHIR R4 interoperability standards for all patient data exchange with existing EHR systems.',
            confidence_score: 85, risk_flag: 'low', status: 'complete',
            generated_answer: 'Our platform is HL7 FHIR R4 certified and supports all standard resource types including Patient, Encounter, Observation, and DiagnosticReport. We maintain active integrations with Epic, Cerner, and Meditech via SMART on FHIR. Our FHIR server processes 10,000+ API calls per minute with sub-100ms latency.',
            reasoning_summary: 'Strong match from healthcare capability documentation. FHIR certification is current.',
        },
        {
            id: 'c10', clause_index: 2, clause_type: 'compliance',
            clause_text: 'All systems handling Protected Health Information (PHI) must comply with HIPAA Security Rule requirements including encryption, access controls, and audit trails.',
            confidence_score: 96, risk_flag: 'low', status: 'complete',
            generated_answer: 'Aeonark Labs is HIPAA-compliant with annual SOC 2 Type II attestation. PHI is encrypted at rest (AES-256) and in transit (TLS 1.3). Role-based access control enforces minimum necessary access. Comprehensive audit trails capture all PHI access with 7-year retention. We execute BAAs with all covered entities.',
            reasoning_summary: 'Very high confidence — direct compliance documentation match with 5 prior healthcare proposals.',
        },
    ],
}

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
            // Demo mode — use built-in sample data
            if (isSupabasePlaceholder()) {
                setRFPs(DEMO_RFPS)
                setSelectedRFP(DEMO_RFPS[0].id)
                setLoading(false)
                return
            }

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

        // Demo mode
        if (isSupabasePlaceholder()) {
            setClauses(DEMO_CLAUSES[rfpId] || [])
            setLoading(false)
            return
        }

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
