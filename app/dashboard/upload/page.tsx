"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]
const MAX_SIZE_MB = 25

type FileState = {
  file: File
  status: "pending" | "uploading" | "processing" | "complete" | "error"
  progress: number
  error?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileState[]>([])
  const [dragOver, setDragOver] = useState(false)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles: FileState[] = Array.from(incoming)
      .filter((f) => {
        if (!ACCEPTED_TYPES.includes(f.type) && !f.name.endsWith(".txt")) {
          return false
        }
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
          return false
        }
        return true
      })
      .map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const simulateUpload = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading", progress: 0 } : f
      )
    )

    // Simulate progress
    const interval = setInterval(() => {
      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.status === "uploading") {
            const newProgress = Math.min(f.progress + Math.random() * 20, 100)
            if (newProgress >= 100) {
              return { ...f, progress: 100, status: "processing" as const }
            }
            return { ...f, progress: newProgress }
          }
          if (f.status === "processing") {
            return { ...f, status: "complete" as const }
          }
          return f
        })

        const allDone = updated.every(
          (f) => f.status === "complete" || f.status === "error" || f.status === "pending"
        )
        if (allDone && updated.some((f) => f.status === "complete")) {
          clearInterval(interval)
        }

        return updated
      })
    }, 600)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Upload RFP
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload RFP documents for AI-powered analysis and clause extraction.
        </p>
      </div>

      {/* Drop zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files.length) {
                addFiles(e.dataTransfer.files)
              }
            }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Drag and drop your RFP documents here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, DOCX, or TXT up to {MAX_SIZE_MB}MB
            </p>
            <label className="mt-4">
              <input
                type="file"
                className="sr-only"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    addFiles(e.target.files)
                  }
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Selected Files
            </CardTitle>
            <CardDescription>{files.length} file(s) selected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {files.map((f, i) => (
                <div
                  key={`${f.file.name}-${i}`}
                  className="flex items-center gap-4 rounded-lg border border-border p-4"
                >
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {f.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(f.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {(f.status === "uploading" || f.status === "processing") && (
                      <div className="mt-2">
                        <Progress
                          value={f.status === "processing" ? 100 : f.progress}
                          className="h-1.5"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {f.status === "processing"
                            ? "AI is processing..."
                            : `Uploading ${Math.round(f.progress)}%`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === "complete" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {f.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {f.status === "pending" && (
                      <button
                        onClick={() => removeFile(i)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={simulateUpload}
                disabled={!files.some((f) => f.status === "pending")}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload & Analyze
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
