'use client'

import { useState } from 'react'
import { Database, Upload, FileText, CheckCircle2, Loader2, Trash2, Search } from 'lucide-react'

interface KnowledgeDoc {
    id: string
    name: string
    type: 'rfp_response' | 'policy' | 'capability'
    uploadedAt: string
    processed: boolean
    chunkCount: number
    sizeMB: number
}

const mockDocs: KnowledgeDoc[] = [
    { id: '1', name: 'FY2024 DoD Cyber RFP Response.pdf', type: 'rfp_response', uploadedAt: '2 days ago', processed: true, chunkCount: 42, sizeMB: 3.2 },
    { id: '2', name: 'Company Security Policy v4.1.docx', type: 'policy', uploadedAt: '5 days ago', processed: true, chunkCount: 18, sizeMB: 1.1 },
    { id: '3', name: 'Technical Capabilities Brief.pdf', type: 'capability', uploadedAt: '1 week ago', processed: true, chunkCount: 27, sizeMB: 2.4 },
    { id: '4', name: 'Healthcare IT Proposal Draft.docx', type: 'rfp_response', uploadedAt: '3 hours ago', processed: false, chunkCount: 0, sizeMB: 4.7 },
]

const typeLabels: Record<string, { label: string; style: string }> = {
    rfp_response: { label: 'RFP Response', style: 'bg-aeon-blue/10 text-aeon-blue' },
    policy: { label: 'Policy', style: 'bg-aeon-emerald/10 text-aeon-emerald' },
    capability: { label: 'Capability', style: 'bg-aeon-violet/10 text-aeon-violet' },
}

export default function KnowledgePage() {
    const [docs, setDocs] = useState(mockDocs)
    const [search, setSearch] = useState('')

    const filtered = docs.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
    )
    const totalChunks = docs.filter((d) => d.processed).reduce((a, d) => a + d.chunkCount, 0)
    const totalSize = docs.reduce((a, d) => a + d.sizeMB, 0)

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="w-6 h-6" />
                    Knowledge Vault
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Upload historical RFPs and company documents to train your AI. More data = better responses.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold gradient-text">{docs.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Documents</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold gradient-text">{totalChunks}</div>
                    <div className="text-xs text-muted-foreground mt-1">Knowledge Chunks</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold gradient-text">{totalSize.toFixed(1)} MB</div>
                    <div className="text-xs text-muted-foreground mt-1">Vault Size</div>
                </div>
            </div>

            {/* Upload */}
            <div className="glass-card rounded-xl p-6 border-dashed border-2 border-border/50 text-center">
                <label className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-aeon-blue/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-aeon-blue" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Upload Training Document</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX — Historical RFPs, policies, capability statements</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.docx" />
                </label>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                />
            </div>

            {/* Document list */}
            <div className="space-y-3">
                {filtered.map((doc) => (
                    <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{doc.name}</div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeLabels[doc.type].style}`}>
                                    {typeLabels[doc.type].label}
                                </span>
                                <span className="text-xs text-muted-foreground">{doc.sizeMB} MB</span>
                                <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                                {doc.processed ? (
                                    <span className="flex items-center gap-1 text-xs text-aeon-emerald">
                                        <CheckCircle2 className="w-3 h-3" /> {doc.chunkCount} chunks
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-aeon-blue">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                                    </span>
                                )}
                            </div>
                        </div>
                        <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
