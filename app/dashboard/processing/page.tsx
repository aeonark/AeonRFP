import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

type ProcessingItem = {
  id: string
  name: string
  status: "queued" | "extracting" | "analyzing" | "complete" | "error"
  progress: number
  clauses?: number
  uploadedAt: string
}

const items: ProcessingItem[] = [
  {
    id: "1",
    name: "Enterprise SaaS RFP.pdf",
    status: "complete",
    progress: 100,
    clauses: 47,
    uploadedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Government IT Services RFP.docx",
    status: "analyzing",
    progress: 72,
    uploadedAt: "5 hours ago",
  },
  {
    id: "3",
    name: "Healthcare Platform RFP.pdf",
    status: "extracting",
    progress: 35,
    uploadedAt: "6 hours ago",
  },
  {
    id: "4",
    name: "Financial Services RFP.pdf",
    status: "queued",
    progress: 0,
    uploadedAt: "7 hours ago",
  },
  {
    id: "5",
    name: "Retail Integration RFP.docx",
    status: "error",
    progress: 45,
    uploadedAt: "1 day ago",
  },
]

const statusConfig = {
  queued: {
    label: "Queued",
    icon: Clock,
    variant: "secondary" as const,
  },
  extracting: {
    label: "Extracting",
    icon: Loader2,
    variant: "outline" as const,
  },
  analyzing: {
    label: "Analyzing",
    icon: Loader2,
    variant: "outline" as const,
  },
  complete: {
    label: "Complete",
    icon: CheckCircle2,
    variant: "default" as const,
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    variant: "destructive" as const,
  },
}

export default function ProcessingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          RFP Processing Status
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the AI processing pipeline for your uploaded RFP documents.
        </p>
      </div>

      {/* Pipeline summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Queued", count: 1, color: "bg-muted-foreground" },
          { label: "Processing", count: 2, color: "bg-accent" },
          { label: "Complete", count: 1, color: "bg-green-500" },
          { label: "Errors", count: 1, color: "bg-destructive" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className={`h-3 w-3 rounded-full ${s.color}`} />
              <div>
                <p className="text-xl font-bold text-card-foreground">
                  {s.count}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Processing items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">
            Documents
          </CardTitle>
          <CardDescription>
            {items.length} documents in the pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const config = statusConfig[item.status]
              const Icon = config.icon
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {item.uploadedAt}
                      {item.clauses && ` | ${item.clauses} clauses extracted`}
                    </p>
                    {(item.status === "extracting" ||
                      item.status === "analyzing") && (
                      <Progress value={item.progress} className="mt-2 h-1.5" />
                    )}
                  </div>
                  <Badge variant={config.variant} className="w-fit gap-1.5">
                    <Icon
                      className={`h-3 w-3 ${
                        item.status === "extracting" ||
                        item.status === "analyzing"
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    {config.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
