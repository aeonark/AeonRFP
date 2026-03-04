'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    FileEdit,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    Loader2,
    Copy,
    RotateCcw,
    Send,
    AlertCircle,
    Inbox,
    FileText,
    Brain,
    Search,
    Shield,
    TrendingUp,
    RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Types
// ============================================

interface ClauseSection {
    id: string
    clause_index: number
    clause_text: string
    clause_type: string
    status: 'pending' | 'generating' | 'complete' | 'error'
    generated_answer: string | null
    confidence_score: number | null
    risk_flag: string | null
    reasoning_summary: string | null
}

interface RFPDocument {
    id: string
    title: string
    status: string
    clause_count: number | null
    created_at: string
}

interface SSEEvent {
    stage: string
    progress: number
    result?: {
        answer: string
        confidence_score: number
        risk_flag: string
        reasoning_summary: string
    }
    error?: string
}

// ============================================
// SSE Stage Labels
// ============================================

const STAGE_LABELS: Record<string, { label: string; icon: 'brain' | 'search' | 'shield' | 'sparkles' | 'trending' }> = {
    normalizing: { label: 'Normalizing clause text…', icon: 'sparkles' },
    embedding: { label: 'Generating embedding vector…', icon: 'brain' },
    searching: { label: 'Searching knowledge base…', icon: 'search' },
    ranking: { label: 'Re-ranking matches…', icon: 'trending' },
    compressing: { label: 'Compressing context…', icon: 'sparkles' },
    generating: { label: 'AI generating response…', icon: 'brain' },
    validating: { label: 'Validating response…', icon: 'shield' },
    complete: { label: 'Generation complete!', icon: 'shield' },
}

function StageIcon({ icon, className }: { icon: string; className?: string }) {
    switch (icon) {
        case 'brain': return <Brain className={className} />
        case 'search': return <Search className={className} />
        case 'shield': return <Shield className={className} />
        case 'trending': return <TrendingUp className={className} />
        default: return <Sparkles className={className} />
    }
}

// ============================================
// Main Page
// ============================================

export default function EditorPage() {
    const [sections, setSections] = useState<ClauseSection[]>([])
    const [rfps, setRFPs] = useState<RFPDocument[]>([])
    const [selectedRFP, setSelectedRFP] = useState<string | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // SSE streaming state
    const [generatingId, setGeneratingId] = useState<string | null>(null)
    const [currentStage, setCurrentStage] = useState<string>('')
    const [currentProgress, setCurrentProgress] = useState<number>(0)
    const abortRef = useRef<AbortController | null>(null)

    const supabase = createClient()

    // -----------------------------------
    // Load available RFPs
    // -----------------------------------
    useEffect(() => {
        async function loadRFPs() {
            try {
                const { data, error: fetchErr } = await supabase
                    .from('rfp_documents')
                    .select('id, title, status, clause_count, created_at')
                    .in('status', ['completed', 'processing'])
                    .order('created_at', { ascending: false })

                if (fetchErr) throw fetchErr

                const rfpList = (data || []) as RFPDocument[]
                setRFPs(rfpList)

                if (rfpList.length > 0) {
                    const first = rfpList.find((r) => r.status === 'completed') || rfpList[0]
                    setSelectedRFP(first.id)
                }
            } catch (err) {
                console.error('[editor] Failed to load RFPs:', err)
                setError('Failed to load RFP documents')
            } finally {
                setLoading(false)
            }
        }

        loadRFPs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // -----------------------------------
    // Load clauses for selected RFP
    // -----------------------------------
    const fetchClauses = useCallback(async (rfpId: string) => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchErr } = await supabase
                .from('clauses')
                .select('id, clause_index, clause_text, clause_type, generated_answer, confidence_score, risk_flag, reasoning_summary, status')
                .eq('rfp_id', rfpId)
                .order('clause_index', { ascending: true })

            if (fetchErr) throw fetchErr

            const clauseList = (data || []).map((c: Record<string, unknown>) => ({
                ...c,
                status: c.generated_answer ? 'complete' : 'pending',
            })) as ClauseSection[]

            setSections(clauseList)

            // Auto-select the first clause
            if (clauseList.length > 0 && (!activeId || !clauseList.find((c) => c.id === activeId))) {
                setActiveId(clauseList[0].id)
                setEditContent(clauseList[0].generated_answer || '')
            }
        } catch (err) {
            console.error('[editor] Failed to load clauses:', err)
            setError('Failed to load clauses')
            setSections([])
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId])

    useEffect(() => {
        if (selectedRFP) {
            fetchClauses(selectedRFP)
        }
    }, [selectedRFP, fetchClauses])

    // -----------------------------------
    // Select a section
    // -----------------------------------
    function selectSection(id: string) {
        setActiveId(id)
        const section = sections.find((s) => s.id === id)
        setEditContent(section?.generated_answer || '')
    }

    // -----------------------------------
    // Generate section via SSE streaming
    // -----------------------------------
    async function generateSection(sectionId: string) {
        const section = sections.find((s) => s.id === sectionId)
        if (!section) return

        // Abort any previous generation
        if (abortRef.current) {
            abortRef.current.abort()
        }

        const controller = new AbortController()
        abortRef.current = controller

        // Update UI: status → generating
        setGeneratingId(sectionId)
        setCurrentStage('normalizing')
        setCurrentProgress(0)

        setSections((prev) =>
            prev.map((s) =>
                s.id === sectionId ? { ...s, status: 'generating' as const } : s
            )
        )

        try {
            const response = await fetch('/api/generate-clause', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clause_text: section.clause_text,
                    clause_id: section.id,
                    tenant_id: 'default', // Will be resolved server-side via auth in production
                    company_name: 'Our Organization',
                }),
                signal: controller.signal,
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: 'Generation failed' }))
                throw new Error(errorBody.error || `HTTP ${response.status}`)
            }

            // Read SSE stream
            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })

                // Parse SSE events (format: "data: {...}\n\n")
                const lines = buffer.split('\n\n')
                buffer = lines.pop() || '' // Keep incomplete data in buffer

                for (const line of lines) {
                    const dataLine = line.trim()
                    if (!dataLine.startsWith('data: ')) continue

                    try {
                        const event: SSEEvent = JSON.parse(dataLine.slice(6))

                        // Update progress UI
                        setCurrentStage(event.stage)
                        setCurrentProgress(event.progress || 0)

                        // Handle completion
                        if (event.stage === 'complete' && event.result) {
                            const result = event.result

                            setSections((prev) =>
                                prev.map((s) =>
                                    s.id === sectionId
                                        ? {
                                            ...s,
                                            status: 'complete' as const,
                                            generated_answer: result.answer,
                                            confidence_score: result.confidence_score,
                                            risk_flag: result.risk_flag,
                                            reasoning_summary: result.reasoning_summary,
                                        }
                                        : s
                                )
                            )

                            // Update editor content if this section is active
                            if (sectionId === activeId) {
                                setEditContent(result.answer)
                            }
                        }

                        // Handle errors
                        if (event.stage === 'error') {
                            throw new Error(event.error || 'Generation failed')
                        }
                    } catch (parseErr) {
                        if (parseErr instanceof SyntaxError) {
                            console.warn('[editor] Skipping malformed SSE event')
                        } else {
                            throw parseErr
                        }
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                console.log('[editor] Generation aborted')
                return
            }

            console.error('[editor] Generation failed:', err)

            setSections((prev) =>
                prev.map((s) =>
                    s.id === sectionId
                        ? { ...s, status: 'error' as const }
                        : s
                )
            )
        } finally {
            setGeneratingId(null)
            setCurrentStage('')
            setCurrentProgress(0)
            abortRef.current = null
        }
    }

    // -----------------------------------
    // Save edited content to Supabase
    // -----------------------------------
    async function handleSave() {
        if (!activeId) return

        const section = sections.find((s) => s.id === activeId)
        if (!section) return

        // Update local state
        setSections((prev) =>
            prev.map((s) =>
                s.id === activeId ? { ...s, generated_answer: editContent } : s
            )
        )

        // Persist to database
        try {
            await supabase
                .from('clauses')
                .update({ generated_answer: editContent })
                .eq('id', activeId)
        } catch (err) {
            console.error('[editor] Failed to save:', err)
        }
    }

    // -----------------------------------
    // Generate all pending sections
    // -----------------------------------
    async function generateAllPending() {
        const pending = sections.filter((s) => s.status === 'pending')
        for (const section of pending) {
            await generateSection(section.id)
        }
    }

    // -----------------------------------
    // Derived state
    // -----------------------------------
    const activeSection = sections.find((s) => s.id === activeId)
    const completedCount = sections.filter((s) => s.status === 'complete').length
    const pendingCount = sections.filter((s) => s.status === 'pending').length
    const stageInfo = STAGE_LABELS[currentStage]

    // -----------------------------------
    // Render
    // -----------------------------------
    return (
        <div className="h-[calc(100vh-7rem)] flex gap-6 animate-fade-in">
            {/* Section navigation */}
            <div className="w-72 shrink-0 flex flex-col overflow-hidden">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <FileEdit className="w-5 h-5" />
                    Draft Editor
                </h2>

                {/* RFP selector */}
                {rfps.length > 0 && (
                    <select
                        value={selectedRFP || ''}
                        onChange={(e) => setSelectedRFP(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 mb-3 appearance-none cursor-pointer"
                    >
                        {rfps.map((rfp) => (
                            <option key={rfp.id} value={rfp.id}>
                                {rfp.title || `RFP #${rfp.id.slice(0, 8)}`}
                            </option>
                        ))}
                    </select>
                )}

                {/* Progress summary */}
                {sections.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 px-1">
                        <span className="text-aeon-emerald font-medium">{completedCount} done</span>
                        <span>·</span>
                        <span>{pendingCount} pending</span>
                        <span>·</span>
                        <span>{sections.length} total</span>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading clauses…
                    </div>
                )}

                {/* Section list */}
                <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => selectSection(section.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${activeId === section.id
                                ? 'glass-card border-aeon-blue/30'
                                : 'hover:bg-secondary/50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {section.status === 'complete' && (
                                    <CheckCircle2 className="w-4 h-4 text-aeon-emerald shrink-0" />
                                )}
                                {section.status === 'generating' && (
                                    <Loader2 className="w-4 h-4 text-aeon-blue animate-spin shrink-0" />
                                )}
                                {section.status === 'pending' && (
                                    <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                                )}
                                {section.status === 'error' && (
                                    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        Clause {section.clause_index}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {section.clause_text.slice(0, 60)}…
                                    </div>
                                </div>
                                {activeId === section.id && (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                            </div>

                            {/* SSE Progress bar for generating section */}
                            {section.id === generatingId && (
                                <div className="mt-2">
                                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-aeon-blue to-aeon-violet transition-all duration-500"
                                            style={{ width: `${currentProgress}%` }}
                                        />
                                    </div>
                                    {stageInfo && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <StageIcon icon={stageInfo.icon} className="w-3 h-3 text-aeon-blue animate-pulse" />
                                            <span className="text-[10px] text-aeon-blue">{stageInfo.label}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Generate all button */}
                {pendingCount > 0 && (
                    <button
                        onClick={generateAllPending}
                        disabled={!!generatingId}
                        className="w-full mt-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-sm font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate All ({pendingCount})
                    </button>
                )}
            </div>

            {/* Editor panel */}
            <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
                {activeSection ? (
                    <>
                        {/* Editor header */}
                        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold">
                                    Clause {activeSection.clause_index}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${activeSection.clause_type === 'technical' ? 'bg-aeon-blue/10 text-aeon-blue' :
                                        activeSection.clause_type === 'compliance' ? 'bg-aeon-emerald/10 text-aeon-emerald' :
                                            activeSection.clause_type === 'financial' ? 'bg-chart-4/10 text-chart-4' :
                                                'bg-muted text-muted-foreground'
                                        }`}>
                                        {activeSection.clause_type}
                                    </span>
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {activeSection.clause_text}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                {activeSection.status === 'pending' && (
                                    <button
                                        onClick={() => generateSection(activeSection.id)}
                                        disabled={!!generatingId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aeon-blue/10 text-aeon-blue text-xs font-medium hover:bg-aeon-blue/15 transition-colors disabled:opacity-50"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Generate
                                    </button>
                                )}
                                {activeSection.status === 'error' && (
                                    <button
                                        onClick={() => generateSection(activeSection.id)}
                                        disabled={!!generatingId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/15 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Retry
                                    </button>
                                )}
                                {activeSection.id === generatingId && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aeon-blue/10 text-aeon-blue text-xs font-medium">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        {stageInfo?.label || 'Processing…'}
                                    </div>
                                )}
                                {activeSection.confidence_score != null && activeSection.confidence_score > 0 && (
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${activeSection.confidence_score >= 80 ? 'bg-aeon-emerald/10 text-aeon-emerald' :
                                        activeSection.confidence_score >= 60 ? 'bg-chart-4/10 text-chart-4' :
                                            'bg-destructive/10 text-destructive'
                                        }`}>
                                        {activeSection.confidence_score}% confidence
                                    </div>
                                )}
                                <button
                                    onClick={() => navigator.clipboard.writeText(editContent)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    title="Copy"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => generateSection(activeSection.id)}
                                    disabled={!!generatingId}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                                    title="Regenerate"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Reasoning banner */}
                        {activeSection.reasoning_summary && (
                            <div className="px-6 py-2.5 bg-aeon-blue/5 border-b border-aeon-blue/10 flex items-center gap-2">
                                <Brain className="w-3.5 h-3.5 text-aeon-blue shrink-0" />
                                <span className="text-xs text-muted-foreground">{activeSection.reasoning_summary}</span>
                            </div>
                        )}

                        {/* SSE progress bar for active section */}
                        {activeSection.id === generatingId && (
                            <div className="px-6 py-3 border-b border-border/30 bg-secondary/30">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        {stageInfo && <StageIcon icon={stageInfo.icon} className="w-4 h-4 text-aeon-blue animate-pulse" />}
                                        <span className="text-xs font-medium text-aeon-blue">
                                            {stageInfo?.label || 'Processing…'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{currentProgress}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-aeon-blue to-aeon-violet transition-all duration-500"
                                        style={{ width: `${currentProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Text area */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onBlur={handleSave}
                                disabled={activeSection.id === generatingId}
                                placeholder={
                                    activeSection.status === 'pending'
                                        ? 'Click "Generate" to create AI-powered content, or type your response manually...'
                                        : activeSection.status === 'generating'
                                            ? 'AI is generating a response...'
                                            : 'Edit your response...'
                                }
                                className="w-full h-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                    {editContent.split(/\s+/).filter(Boolean).length} words
                                </span>
                                {activeSection.risk_flag && activeSection.risk_flag !== 'low' && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${activeSection.risk_flag === 'high'
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-chart-4/10 text-chart-4'
                                        }`}>
                                        {activeSection.risk_flag} risk
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={activeSection.id === generatingId}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-aeon-emerald text-white text-xs font-semibold hover:bg-aeon-emerald/90 transition-colors disabled:opacity-50"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Save Section
                            </button>
                        </div>
                    </>
                ) : loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-aeon-blue animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                ) : sections.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <Inbox className="w-10 h-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            {rfps.length === 0
                                ? 'Upload an RFP to start drafting responses.'
                                : 'Select an RFP with processed clauses to begin.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        <FileText className="w-5 h-5 mr-2" />
                        Select a clause to start editing
                    </div>
                )}
            </div>
        </div>
    )
}
