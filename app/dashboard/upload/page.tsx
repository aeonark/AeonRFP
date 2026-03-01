'use client'

import { useState, useCallback } from 'react'
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
} from 'lucide-react'

type FileStatus = 'idle' | 'validating' | 'uploading' | 'processing' | 'complete' | 'error'

interface UploadedFile {
    name: string
    size: number
    type: string
    status: FileStatus
    progress: number
    error?: string
}

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [dragOver, setDragOver] = useState(false)

    function validateFile(file: File): string | null {
        if (!ALLOWED_TYPES.includes(file.type)) return 'Unsupported file type. Use PDF, DOCX, or XLSX.'
        if (file.size > MAX_SIZE) return 'File exceeds 50MB limit.'
        return null
    }

    const handleFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return
        const newFiles: UploadedFile[] = Array.from(fileList).map((file) => {
            const error = validateFile(file)
            return {
                name: file.name,
                size: file.size,
                type: file.type,
                status: error ? 'error' : 'idle',
                progress: 0,
                error: error || undefined,
            }
        })
        setFiles((prev) => [...prev, ...newFiles])

        // Simulate upload + processing for valid files
        newFiles.forEach((f, i) => {
            if (f.status === 'error') return
            const idx = files.length + i
            simulateUpload(idx)
        })
    }, [files.length])

    function simulateUpload(fileIndex: number) {
        const stages: { status: FileStatus; duration: number }[] = [
            { status: 'validating', duration: 800 },
            { status: 'uploading', duration: 2000 },
            { status: 'processing', duration: 3000 },
            { status: 'complete', duration: 0 },
        ]

        let delay = 0
        stages.forEach((stage) => {
            delay += stage.duration
            setTimeout(() => {
                setFiles((prev) =>
                    prev.map((f, i) =>
                        i === fileIndex
                            ? {
                                ...f,
                                status: stage.status,
                                progress:
                                    stage.status === 'validating' ? 15
                                        : stage.status === 'uploading' ? 60
                                            : stage.status === 'processing' ? 90
                                                : 100,
                            }
                            : f
                    )
                )
            }, delay)
        })
    }

    function removeFile(index: number) {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Upload RFP</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Drop your RFP document and let AI extract and analyze every clause.
                </p>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragOver
                        ? 'border-aeon-blue bg-aeon-blue/5 scale-[1.01]'
                        : 'border-border/60 hover:border-border'
                    }`}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${dragOver ? 'bg-aeon-blue/15' : 'bg-secondary'
                        }`}>
                        <Upload className={`w-7 h-7 transition-colors ${dragOver ? 'text-aeon-blue' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <p className="text-base font-medium">
                            {dragOver ? 'Drop to upload' : 'Drag & drop your RFP document'}
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
                            onChange={(e) => handleFiles(e.target.files)}
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
                                <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{formatFileSize(file.size)}</span>
                                </div>
                                {/* Progress bar */}
                                {file.status !== 'error' && file.status !== 'idle' && (
                                    <div className="mt-2">
                                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${file.status === 'complete' ? 'bg-aeon-emerald' : 'bg-aeon-blue'
                                                    }`}
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {file.status === 'processing' && (
                                                <Sparkles className="w-3 h-3 text-aeon-blue animate-pulse" />
                                            )}
                                            {file.status === 'complete' && (
                                                <CheckCircle2 className="w-3 h-3 text-aeon-emerald" />
                                            )}
                                            {(file.status === 'validating' || file.status === 'uploading') && (
                                                <Loader2 className="w-3 h-3 text-aeon-blue animate-spin" />
                                            )}
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {file.status === 'processing' ? 'AI Processing...' : file.status}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {file.status === 'error' && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <AlertCircle className="w-3 h-3 text-destructive" />
                                        <span className="text-xs text-destructive">{file.error}</span>
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
        </div>
    )
}
