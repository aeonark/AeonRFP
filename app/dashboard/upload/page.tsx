'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
    ArrowRight,
    Brain,
    Search,
    FileCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FileStatus =
    | 'idle'
    | 'validating'
    | 'uploading'
    | 'extracting'
    | 'splitting'
    | 'embedding'
    | 'complete'
    | 'error'

interface UploadedFile {
    name: string
    size: number
    type: string
    status: FileStatus
    progress: number
    error?: string
    clausesFound?: number
    rfpId?: string
    file: File // Keep reference to the actual File object
}

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const MAX_SIZE = 50 * 1024 * 1024

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_LABELS: Record<FileStatus, string> = {
    idle: 'Ready',
    validating: 'Validating document…',
    uploading: 'Sending to processing server…',
    extracting: 'AI extracting text from document…',
    splitting: 'Splitting into clauses & classifying…',
    embedding: 'Analyzing clause types & risk levels…',
    complete: 'Processing complete!',
    error: 'Failed',
}

export default function UploadPage() {
    const router = useRouter()
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [allDone, setAllDone] = useState(false)
    const fileInputRef = useRef<File[]>([]) // Store actual File objects

    function validateFile(file: File): string | null {
        if (!ALLOWED_TYPES.includes(file.type))
            return 'Unsupported file type. Use PDF, DOCX, or XLSX.'
        if (file.size > MAX_SIZE) return 'File exceeds 50MB limit.'
        return null
    }

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return
            const rawFiles = Array.from(fileList)

            const newFiles: UploadedFile[] = rawFiles.map((file) => {
                const error = validateFile(file)
                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: error ? 'error' : 'idle',
                    progress: 0,
                    error: error || undefined,
                    file,
                }
            })

            setFiles((prev) => {
                const updated = [...prev, ...newFiles]
                // Start processing valid files
                newFiles.forEach((f, i) => {
                    if (f.status === 'error') return
                    const idx = prev.length + i
                    processFile(idx, f.file)
                })
                return updated
            })
            setAllDone(false)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    function updateFile(index: number, updates: Partial<UploadedFile>) {
        setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
        )
    }

    async function processFile(fileIndex: number, file: File) {
        // Stage 1: Validating
        updateFile(fileIndex, { status: 'validating', progress: 10 })
        await new Promise((r) => setTimeout(r, 300))

        // Stage 2: Upload to server for processing
        updateFile(fileIndex, { status: 'uploading', progress: 20 })

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Stage 3: Extracting — Call the real processing API
            updateFile(fileIndex, { status: 'extracting', progress: 40 })

            const response = await fetch('/api/upload-rfp', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const rawText = await response.text()
                let finalMsg = `HTTP ${response.status} FATAL CRASH: ${rawText}`
                try {
                    const parsed = JSON.parse(rawText)
                    if (parsed.error) finalMsg = parsed.error
                } catch(e) {}
                throw new Error(finalMsg)
            }

            const result = await response.json()

            // Stage 4: Processing (handled by backend async, we simulate progress for UX)
            updateFile(fileIndex, { status: 'splitting', progress: 65 })
            await new Promise((r) => setTimeout(r, 1000))

            // Stage 5: Done (Real implementation would poll status or use Supabase realtime)
            updateFile(fileIndex, { status: 'embedding', progress: 80 })
            await new Promise((r) => setTimeout(r, 1000))

            // Stage 6: Complete
            updateFile(fileIndex, {
                status: 'complete',
                progress: 100,
                clausesFound: result.clauses_extracted || 0,
                rfpId: result.rfp_id,
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Processing failed'
            updateFile(fileIndex, {
                status: 'error',
                progress: 0,
                error: message,
            })
        }

        // Check if all files are done
        setFiles((prev) => {
            const allComplete = prev.every(
                (f) => f.status === 'complete' || f.status === 'error'
            )
            if (allComplete) setAllDone(true)
            return prev
        })
    }

    function removeFile(index: number) {
        setFiles((prev) => {
            const next = prev.filter((_, i) => i !== index)
            if (next.length === 0) setAllDone(false)
            return next
        })
    }

    const completedFiles = files.filter((f) => f.status === 'complete')
    const totalClauses = completedFiles.reduce(
        (sum, f) => sum + (f.clausesFound || 0),
        0
    )

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Upload RFP</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Drop your RFP document and let AI extract and analyze every
                    clause.
                </p>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    handleFiles(e.dataTransfer.files)
                }}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragOver
                    ? 'border-aeon-blue bg-aeon-blue/5 scale-[1.01]'
                    : 'border-border/60 hover:border-border'
                    }`}
            >
                <div className="flex flex-col items-center gap-4">
                    <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${dragOver ? 'bg-aeon-blue/15' : 'bg-secondary'
                            }`}
                    >
                        <Upload
                            className={`w-7 h-7 transition-colors ${dragOver
                                ? 'text-aeon-blue'
                                : 'text-muted-foreground'
                                }`}
                        />
                    </div>
                    <div>
                        <p className="text-base font-medium">
                            {dragOver
                                ? 'Drop to upload'
                                : 'Drag & drop your RFP document'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            PDF, DOCX, or XLSX — up to 50MB
                        </p>
                    </div>
                    <label className="px-5 py-2.5 rounded-lg bg-secondary text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                        Browse Files
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.xlsx"
                            multiple
                            onChange={(e) => {
                                handleFiles(e.target.files)
                                e.target.value = ''
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Files ({files.length})
                    </h2>
                    {files.map((file, i) => (
                        <div
                            key={`${file.name}-${i}`}
                            className="glass-card rounded-xl p-4 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                {file.status === 'complete' ? (
                                    <CheckCircle2 className="w-5 h-5 text-aeon-emerald" />
                                ) : file.status === 'error' ? (
                                    <AlertCircle className="w-5 h-5 text-destructive" />
                                ) : (
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium truncate">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                        {formatFileSize(file.size)}
                                    </span>
                                </div>

                                {/* Progress */}
                                {file.status !== 'error' &&
                                    file.status !== 'idle' && (
                                        <div className="mt-2">
                                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${file.status ===
                                                        'complete'
                                                        ? 'bg-aeon-emerald'
                                                        : 'bg-gradient-to-r from-aeon-blue to-aeon-violet'
                                                        }`}
                                                    style={{
                                                        width: `${file.progress}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {file.status ===
                                                    'extracting' && (
                                                        <Brain className="w-3 h-3 text-aeon-violet animate-pulse" />
                                                    )}
                                                {file.status ===
                                                    'splitting' && (
                                                        <FileCheck className="w-3 h-3 text-aeon-blue animate-pulse" />
                                                    )}
                                                {file.status ===
                                                    'embedding' && (
                                                        <Search className="w-3 h-3 text-aeon-cyan animate-pulse" />
                                                    )}
                                                {file.status ===
                                                    'complete' && (
                                                        <CheckCircle2 className="w-3 h-3 text-aeon-emerald" />
                                                    )}
                                                {(file.status ===
                                                    'validating' ||
                                                    file.status ===
                                                    'uploading') && (
                                                        <Loader2 className="w-3 h-3 text-aeon-blue animate-spin" />
                                                    )}
                                                {file.status ===
                                                    'uploading' && (
                                                        <Sparkles className="w-3 h-3 text-aeon-blue animate-pulse" />
                                                    )}
                                                <span className="text-xs text-muted-foreground">
                                                    {STATUS_LABELS[file.status]}
                                                </span>
                                                {file.status === 'complete' &&
                                                    file.clausesFound && (
                                                        <span className="text-xs text-aeon-emerald ml-auto">
                                                            {file.clausesFound}{' '}
                                                            clauses extracted
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    )}

                                {file.status === 'error' && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <AlertCircle className="w-3 h-3 text-destructive" />
                                        <span className="text-xs text-destructive">
                                            {file.error}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => removeFile(i)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary + Continue */}
            {allDone && completedFiles.length > 0 && (
                <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in border border-aeon-emerald/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-aeon-emerald/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-aeon-emerald" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold">
                                Processing Complete
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {completedFiles.length} document
                                {completedFiles.length > 1 ? 's' : ''} processed
                                · {totalClauses} clauses extracted
                            </p>
                        </div>
                    </div>

                    {/* Processing summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-secondary/50 p-3 text-center">
                            <div className="text-lg font-bold text-aeon-blue">
                                {totalClauses}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Clauses Found
                            </div>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-3 text-center">
                            <div className="text-lg font-bold text-aeon-violet">
                                {completedFiles.length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Documents Processed
                            </div>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-3 text-center">
                            <div className="text-lg font-bold text-aeon-emerald">
                                Real Data
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Analysis Type
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/dashboard/clauses')}
                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-aeon-blue/20 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            View Clause Intelligence
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/editor')}
                            className="h-11 px-5 rounded-xl bg-secondary text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
                        >
                            Go to Draft Editor
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
