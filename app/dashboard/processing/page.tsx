'use client'

import { Clock, CheckCircle2, Loader2, AlertCircle, FileText, Brain, Database } from 'lucide-react'

const rfps = [
    {
        id: '1',
        name: 'DOD Cybersecurity Framework RFP',
        uploadedAt: '2 hours ago',
        status: 'completed' as const,
        stages: [
            { label: 'Uploaded', done: true },
            { label: 'Text Extracted', done: true },
            { label: 'Clauses Parsed', done: true },
            { label: 'Embeddings Generated', done: true },
            { label: 'SmartMatch Ready', done: true },
        ],
        clauseCount: 47,
    },
    {
        id: '2',
        name: 'Healthcare IT Modernization',
        uploadedAt: '4 hours ago',
        status: 'processing' as const,
        stages: [
            { label: 'Uploaded', done: true },
            { label: 'Text Extracted', done: true },
            { label: 'Clauses Parsed', done: true },
            { label: 'Embeddings Generated', done: false },
            { label: 'SmartMatch Ready', done: false },
        ],
        clauseCount: 31,
    },
    {
        id: '3',
        name: 'Smart City Infrastructure RFI',
        uploadedAt: '1 day ago',
        status: 'failed' as const,
        stages: [
            { label: 'Uploaded', done: true },
            { label: 'Text Extracted', done: false },
            { label: 'Clauses Parsed', done: false },
            { label: 'Embeddings Generated', done: false },
            { label: 'SmartMatch Ready', done: false },
        ],
        clauseCount: 0,
        error: 'Failed to extract text — document may be image-based.',
    },
]

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'completed':
            return <CheckCircle2 className="w-5 h-5 text-aeon-emerald" />
        case 'processing':
            return <Loader2 className="w-5 h-5 text-aeon-blue animate-spin" />
        case 'failed':
            return <AlertCircle className="w-5 h-5 text-destructive" />
        default:
            return <Clock className="w-5 h-5 text-muted-foreground" />
    }
}

export default function ProcessingPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">RFP Processing</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Track the AI processing pipeline for your uploaded documents.
                </p>
            </div>

            {/* Pipeline legend */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Upload
                </div>
                <span className="text-border">→</span>
                <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> Parse
                </div>
                <span className="text-border">→</span>
                <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" /> Embed
                </div>
                <span className="text-border">→</span>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </div>
            </div>

            {/* RFP cards */}
            <div className="space-y-4">
                {rfps.map((rfp) => (
                    <div key={rfp.id} className="glass-card rounded-xl p-6">
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <StatusIcon status={rfp.status} />
                                <div>
                                    <h3 className="text-base font-semibold">{rfp.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Uploaded {rfp.uploadedAt} · {rfp.clauseCount > 0 ? `${rfp.clauseCount} clauses` : 'Pending'}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${rfp.status === 'completed'
                                        ? 'bg-aeon-emerald/10 text-aeon-emerald'
                                        : rfp.status === 'processing'
                                            ? 'bg-aeon-blue/10 text-aeon-blue'
                                            : 'bg-destructive/10 text-destructive'
                                    }`}
                            >
                                {rfp.status}
                            </span>
                        </div>

                        {/* Pipeline stages */}
                        <div className="flex items-center gap-2">
                            {rfp.stages.map((stage, i) => (
                                <div key={stage.label} className="flex items-center gap-2 flex-1">
                                    <div className="flex-1">
                                        <div
                                            className={`h-1.5 rounded-full ${stage.done ? 'bg-aeon-blue' : 'bg-secondary'
                                                }`}
                                        />
                                        <span className={`text-[10px] mt-1 block ${stage.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                    {i < rfp.stages.length - 1 && (
                                        <div className="w-2 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {rfp.error && (
                            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                <span className="text-xs text-destructive">{rfp.error}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
