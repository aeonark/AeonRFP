'use client'

import { useState, useRef, useEffect } from 'react'
import { Database, Upload, FileText, CheckCircle2, Loader2, Trash2, Search, Brain, Activity, ShieldAlert, Cpu, Terminal, Sparkles, Server, Check } from 'lucide-react'

// --- Types ---
interface KnowledgeDoc {
    id: string
    name: string
    type: 'rfp_response' | 'policy' | 'capability'
    uploadedAt: string
    processed: boolean
    chunkCount: number
    sizeMB: number
}

type ViewState = 'dashboard' | 'preflight' | 'training' | 'success'

// --- Mock Data ---
const mockDocs: KnowledgeDoc[] = [
    { id: '1', name: 'FY2024 DoD Cyber RFP Response.pdf', type: 'rfp_response', uploadedAt: '2 days ago', processed: true, chunkCount: 42, sizeMB: 3.2 },
    { id: '2', name: 'Company Security Policy v4.1.docx', type: 'policy', uploadedAt: '5 days ago', processed: true, chunkCount: 18, sizeMB: 1.1 },
    { id: '3', name: 'Technical Capabilities Brief.pdf', type: 'capability', uploadedAt: '1 week ago', processed: true, chunkCount: 27, sizeMB: 2.4 },
]

const typeLabels: Record<string, { label: string; style: string }> = {
    rfp_response: { label: 'RFP Response', style: 'bg-aeon-blue/10 text-aeon-blue' },
    policy: { label: 'Policy', style: 'bg-aeon-emerald/10 text-aeon-emerald' },
    capability: { label: 'Capability', style: 'bg-aeon-violet/10 text-aeon-violet' },
}

const STORAGE_LIMIT_MB = 500 // Growth Tier Mock Limit
const TRAINING_LOGS = [
    "[SYS] Initializing SmartMatch Neural Environment...",
    "[SYS] Validating organizational document integrity...",
    "[EXT] Fragmenting raw text into 500-token logical block units...",
    "[RAG] Connecting to Gemini Embedding-001 Gateway...",
    "[RAG] Generating high-dimensional vector embeddings...",
    "[RAG] Vector synchronization complete. Indexing to Qdrant Vault...",
    "[NLP] Initiating Linguistic Profiling sweep...",
    "[NLP] Evaluating sentence cadence and enterprise tone...",
    "[NLP] Extracting recurring formatting signatures and headers...",
    "[NLP] Modeling organizational sign-off protocol...",
    "[SYS] Compiling Master Corporate Voice Profile...",
    "[SYS] Optimization sequence finalized. Engine ready.",
]

export default function KnowledgePage() {
    const [docs, setDocs] = useState<KnowledgeDoc[]>(mockDocs)
    const [search, setSearch] = useState('')
    const [viewState, setViewState] = useState<ViewState>('dashboard')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    
    // Training state
    const [logs, setLogs] = useState<string[]>([])
    const [progress, setProgress] = useState(0)
    const logContainerRef = useRef<HTMLDivElement>(null)

    // Derived dashboard stats
    const filtered = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    const totalChunks = docs.filter((d) => d.processed).reduce((a, d) => a + d.chunkCount, 0)
    const totalSize = docs.reduce((a, d) => a + d.sizeMB, 0)
    const storagePercent = (totalSize / STORAGE_LIMIT_MB) * 100

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
        }
    }, [logs])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            setViewState('preflight')
        }
    }

    const startTraining = () => {
        setViewState('training')
        setLogs([])
        setProgress(0)
        
        let currentLogIndex = 0;
        
        // Simulate Watson-like staggered training timeline
        const interval = setInterval(() => {
            if (currentLogIndex < TRAINING_LOGS.length) {
                setLogs(prev => [...prev, TRAINING_LOGS[currentLogIndex]])
                currentLogIndex++
                setProgress(Math.floor((currentLogIndex / TRAINING_LOGS.length) * 100))
            } else {
                clearInterval(interval)
                setTimeout(() => {
                    const newDoc: KnowledgeDoc = {
                        id: Math.random().toString(),
                        name: selectedFile?.name || 'New Document',
                        type: 'rfp_response',
                        uploadedAt: 'Just now',
                        processed: true,
                        chunkCount: Math.floor(Math.random() * 50) + 10,
                        sizeMB: parseFloat(((selectedFile?.size || 100000) / (1024 * 1024)).toFixed(2))
                    }
                    setDocs([newDoc, ...docs])
                    setViewState('success')
                }, 1000)
            }
        }, 800) // Emit a new log every ~800ms
    }

    // ==========================================
    // RENDER: DASHBOARD
    // ==========================================
    if (viewState === 'dashboard') {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Brain className="w-6 h-6 text-aeon-blue" />
                            SmartMatch Vault
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Enterprise Knowledge Engine. Train the model on your historical RFPs.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Storage Limits */}
                    <div className="col-span-1 md:col-span-2 glass-card rounded-xl p-5 border-l-4 border-l-aeon-blue flex flex-col justify-center relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute right-0 top-0 w-32 h-32 bg-aeon-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        
                        <div className="flex justify-between items-end mb-2 relative z-10">
                            <div>
                                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                    <Server className="w-4 h-4 text-aeon-blue" />
                                    Vector Storage Allocation
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Enterprise Growth Tier</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold">{totalSize.toFixed(1)} MB</span>
                                <span className="text-sm text-muted-foreground"> / {STORAGE_LIMIT_MB} MB</span>
                            </div>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden relative z-10">
                            <div 
                                className="h-full rounded-full bg-gradient-to-r from-aeon-blue to-aeon-violet" 
                                style={{ width: `${storagePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Widget */}
                    <div className="col-span-1 glass-card rounded-xl p-5 flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex justify-center items-center">
                            <Activity className="w-6 h-6 text-aeon-violet" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold gradient-text">{totalChunks}</div>
                            <div className="text-xs font-medium text-muted-foreground">Trained Logic Chunks</div>
                        </div>
                    </div>
                </div>

                {/* Upload Zone */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-aeon-blue via-aeon-violet to-aeon-blue rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="glass-card rounded-xl p-8 border-dashed border-2 border-aeon-blue/30 text-center relative bg-background">
                        <label className="cursor-pointer flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-aeon-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Upload className="w-6 h-6 text-aeon-blue" />
                            </div>
                            <div>
                                <p className="text-base font-semibold">Upload Organizational Data</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Drag & drop high-quality PDF or DOCX files to train the SmartMatch Engine on your formatting and semantic strategies.
                                </p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileSelect} />
                        </label>
                    </div>
                </div>

                {/* Search & Document List */}
                <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">Indexed Vault Materials</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search training vault..."
                                className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filtered.map((doc) => (
                            <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-aeon-blue/30 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{doc.name}</div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${typeLabels[doc.type].style}`}>
                                            {typeLabels[doc.type].label}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Database className="w-3 h-3" /> {doc.sizeMB} MB
                                        </span>
                                        <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                                        {doc.processed ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-aeon-emerald ml-auto">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Trained
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-aeon-blue ml-auto">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
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
            </div>
        )
    }

    // ==========================================
    // RENDER: PRE-FLIGHT
    // ==========================================
    if (viewState === 'preflight') {
        const estMinutes = Math.max(1, Math.ceil((selectedFile?.size || 0) / (1024 * 1024 * 2))) // Rough estimate: 1 min per 2MB
        
        return (
            <div className="max-w-2xl mx-auto mt-10 animate-fade-in-up">
                <div className="glass-card rounded-2xl overflow-hidden border-aeon-blue/20">
                    <div className="bg-gradient-to-r from-aeon-blue/10 to-transparent p-6 border-b border-border/50">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Cpu className="w-6 h-6 text-aeon-blue" />
                            Pre-Flight Initialization
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Review parameters before altering the Global Model.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                            <FileText className="w-8 h-8 text-aeon-blue shrink-0 mt-1" />
                            <div>
                                <h3 className="text-sm font-semibold">{selectedFile?.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Size: {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Format: {selectedFile?.type || 'Document'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3">
                            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-destructive">Caution: Permanent Neural Shift</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Training the SmartMatch Engine on this document will permanently alter its linguistic profiling for your Organization. It will learn and replicate the tonal structures, formatting layout, and vocabulary found in this file. <strong>Ensure this data represents your highest quality standard.</strong>
                                </p>
                                <p className="text-xs font-semibold text-foreground mt-3">
                                    Estimated Processing Time: ~{estMinutes} minute{estMinutes > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setViewState('dashboard')}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                            >
                                Cancel Upload
                            </button>
                            <button 
                                onClick={startTraining}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-aeon-blue text-white text-sm font-semibold hover:bg-aeon-blue/90 hover:shadow-lg hover:shadow-aeon-blue/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Brain className="w-4 h-4" /> Initialize Training
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // RENDER: TRAINING (IBM WATSON STYLE ANIMATION)
    // ==========================================
    if (viewState === 'training') {
        return (
            <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center animate-fade-in">
                {/* CSS Animations definitions inside standard style tag */}
                <style>{`
                    @keyframes pulse-glow {
                        0%, 100% { box-shadow: 0 0 20px 0px rgba(0, 204, 255, 0.4); }
                        50% { box-shadow: 0 0 60px 10px rgba(110, 86, 207, 0.6); }
                    }
                    @keyframes flow-left {
                        0% { stroke-dashoffset: 100; opacity: 0; }
                        20% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { stroke-dashoffset: 0; opacity: 0; }
                    }
                    @keyframes flow-right {
                        0% { stroke-dashoffset: -100; opacity: 0; }
                        20% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { stroke-dashoffset: 0; opacity: 0; }
                    }
                    .path-flow-1 {
                        stroke-dasharray: 10 20;
                        animation: flow-left 2s linear infinite;
                    }
                    .path-flow-2 {
                        stroke-dasharray: 15 15;
                        animation: flow-right 2.5s linear infinite reverse;
                    }
                    .particle {
                        animation: float-up 3s ease-in-out infinite;
                    }
                `}</style>
                
                <h2 className="text-3xl font-light mb-2 gradient-text tracking-wide">
                    Neural Compilation Active
                </h2>
                <p className="text-sm text-muted-foreground mb-12">Extracting linguistic geometry and semantic vectors.</p>

                {/* Animation Canvas */}
                <div className="relative w-full max-w-3xl h-64 flex items-center justify-center mb-12">
                    {/* SVG Flow Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                        {/* Source to Brain (Left side) */}
                        <path d="M 120 128 C 200 128, 250 80, 320 128" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary/50" />
                        <path d="M 120 128 C 200 128, 250 80, 320 128" fill="none" stroke="url(#blue-grad)" strokeWidth="3" strokeLinecap="round" className="path-flow-1" />
                        
                        <path d="M 120 128 C 200 128, 250 176, 320 128" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary/50" />
                        <path d="M 120 128 C 200 128, 250 176, 320 128" fill="none" stroke="url(#violet-grad)" strokeWidth="2" strokeLinecap="round" className="path-flow-2" />

                        {/* Brain to Destination (Right side) */}
                        <path d="M 440 128 C 500 80, 560 128, 640 128" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary/50" />
                        <path d="M 440 128 C 500 80, 560 128, 640 128" fill="none" stroke="url(#blue-grad)" strokeWidth="3" strokeLinecap="round" className="path-flow-1" />
                        
                        <path d="M 440 128 C 500 176, 560 128, 640 128" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary/50" />
                        <path d="M 440 128 C 500 176, 560 128, 640 128" fill="none" stroke="url(#violet-grad)" strokeWidth="2" strokeLinecap="round" className="path-flow-2" />

                        <defs>
                            <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#00CCFF" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                            <linearGradient id="violet-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#6e56cf" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Left Node: Source Document */}
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center border-aeon-blue/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-aeon-blue/10 animate-pulse" />
                            <FileText className="w-8 h-8 text-aeon-blue relative z-10" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3 font-semibold">Raw Data</span>
                    </div>

                    {/* Center Node: SmartMatch Engine */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div 
                            className="w-24 h-24 rounded-full bg-background border border-aeon-violet/30 flex items-center justify-center relative"
                            style={{ animation: 'pulse-glow 3s infinite' }}
                        >
                            <div className="absolute inset-2 rounded-full border border-aeon-blue/20 animate-[spin_4s_linear_infinite]" />
                            <div className="absolute inset-4 rounded-full border border-aeon-violet/20 animate-[spin_3s_linear_infinite_reverse]" />
                            <Brain className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-aeon-violet mt-4 font-semibold absolute left-1/2 -translate-x-1/2 w-max">SmartMatch Engine</span>
                    </div>

                    {/* Right Node: Storage Vault */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center border-aeon-emerald/30 relative">
                            <div className="absolute inset-0 bg-aeon-emerald/5 animate-pulse" />
                            <Database className="w-8 h-8 text-aeon-emerald relative z-10" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3 font-semibold">Vector Vault</span>
                    </div>
                </div>

                {/* Progress Bar & Logs Terminal */}
                <div className="w-full max-w-2xl">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-aeon-blue tracking-wider uppercase">Processing Model Pipeline</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-6">
                        <div 
                            className="h-full bg-gradient-to-r from-aeon-blue to-aeon-violet transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Dark Terminal Log Window */}
                    <div className="bg-[#0A0A0A] border border-border/40 rounded-xl p-4 font-mono text-xs text-aeon-blue h-40 overflow-y-auto relative shadow-inner" ref={logContainerRef}>
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 opacity-50" />
                        </div>
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1.5 opacity-90 animate-fade-in-up flex items-start gap-2">
                                <span className="opacity-50 select-none">❯</span>
                                <span>{log}</span>
                            </div>
                        ))}
                        {progress < 100 && (
                            <div className="animate-pulse opacity-70 mt-1">
                                <span className="opacity-50">❯</span> ▊
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // RENDER: SUCCESS
    // ==========================================
    if (viewState === 'success') {
        return (
            <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center animate-fade-in-up">
                <div className="w-20 h-20 rounded-full bg-aeon-emerald/10 flex items-center justify-center mb-6 ring-8 ring-aeon-emerald/5">
                    <Check className="w-10 h-10 text-aeon-emerald" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Training Complete</h2>
                <p className="text-sm text-muted-foreground max-w-md text-center mb-8">
                    The SmartMatch engine has successfully integrated "{selectedFile?.name}" into its linguistic matrix. 
                    Your Draft Editor will now mirror the formatting protocols extracted from this document.
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => {
                            setViewState('dashboard')
                            setSelectedFile(null)
                        }}
                        className="px-6 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-secondary transition-colors"
                    >
                        Return to Vault
                    </button>
                    <a 
                        href="/dashboard/editor"
                        className="px-6 py-2.5 rounded-xl bg-aeon-blue text-white font-semibold text-sm flex items-center gap-2 hover:bg-aeon-blue/90 hover:shadow-lg hover:shadow-aeon-blue/20 transition-all"
                    >
                        <Sparkles className="w-4 h-4" /> Try Draft Editor
                    </a>
                </div>
            </div>
        )
    }

    return null
}
