"use client"

import { useState } from "react"
import { Brain, ChevronDown, ChevronUp, Lightbulb, Copy } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type Clause = {
  id: string
  title: string
  category: string
  text: string
  similarityScore: number
  confidence: number
  aiExplanation: string
  suggestedAnswer: string
}

const clauses: Clause[] = [
  {
    id: "1",
    title: "Data Security Requirements",
    category: "Security",
    text: "The vendor shall implement SOC2 Type II compliant security controls including encryption at rest and in transit, multi-factor authentication, and regular penetration testing.",
    similarityScore: 92,
    confidence: 95,
    aiExplanation:
      "This clause closely matches 12 previous RFPs you have responded to. Your standard security compliance section covers all requirements. The SOC2 Type II certification requirement is identical to your existing documentation.",
    suggestedAnswer:
      "AeonRFP maintains SOC2 Type II certification with annual audits conducted by independent third parties. All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Multi-factor authentication is enforced for all user accounts, and we conduct quarterly penetration testing through certified security partners.",
  },
  {
    id: "2",
    title: "System Uptime SLA",
    category: "SLA",
    text: "The vendor must guarantee 99.95% uptime with a defined incident response process and escalation procedures.",
    similarityScore: 87,
    confidence: 88,
    aiExplanation:
      "High similarity with 8 previous responses. Your current SLA guarantee of 99.99% exceeds this requirement. Incident response documentation can be reused directly.",
    suggestedAnswer:
      "We guarantee 99.99% uptime backed by our enterprise SLA. Our incident response process follows ITIL best practices with defined escalation tiers: P1 issues receive immediate response within 15 minutes, P2 within 1 hour, and P3 within 4 business hours.",
  },
  {
    id: "3",
    title: "Integration Capabilities",
    category: "Technical",
    text: "The solution must provide RESTful APIs and support integration with SAP, Salesforce, and Microsoft 365 platforms.",
    similarityScore: 74,
    confidence: 72,
    aiExplanation:
      "Partial match with 5 previous responses. REST API coverage is strong but SAP integration is a newer requirement not covered in your existing knowledge base. Microsoft 365 and Salesforce integrations are well documented.",
    suggestedAnswer:
      "Our platform provides comprehensive RESTful APIs with OpenAPI 3.0 documentation. We offer pre-built connectors for Salesforce (CRM, Service Cloud) and Microsoft 365 (Teams, SharePoint, Outlook). SAP integration is available through our universal connector framework with certified S/4HANA compatibility.",
  },
  {
    id: "4",
    title: "Data Residency Requirements",
    category: "Compliance",
    text: "All data must be stored within the continental United States. No data shall be transferred or processed outside US jurisdiction.",
    similarityScore: 65,
    confidence: 60,
    aiExplanation:
      "Moderate similarity. You have addressed data residency in 3 previous proposals but specific US-only requirements are less common in your history. Review recommended before submission.",
    suggestedAnswer:
      "All customer data is stored exclusively in US-based data centers (AWS us-east-1 and us-west-2 regions). Our architecture ensures no data transfer outside US jurisdiction, with geographic routing policies enforced at the infrastructure level. We provide data residency certificates upon request.",
  },
]

function ConfidenceMeter({ value }: { value: number }) {
  const color =
    value >= 80
      ? "text-green-600"
      : value >= 60
        ? "text-yellow-600"
        : "text-destructive"

  return (
    <div className="flex items-center gap-2">
      <Progress
        value={value}
        className="h-2 w-20"
      />
      <span className={`text-xs font-medium ${color}`}>{value}%</span>
    </div>
  )
}

function ClauseCard({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base text-card-foreground">
                {clause.title}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {clause.category}
              </Badge>
            </div>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {clause.text}
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Similarity</p>
            <p className="text-sm font-semibold text-card-foreground">
              {clause.similarityScore}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confidence</p>
            <ConfidenceMeter value={clause.confidence} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2 text-xs">
            <Lightbulb className="h-3.5 w-3.5" />
            AI Explanation & Suggested Answer
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {expanded && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-primary">
                  AI Explanation
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {clause.aiExplanation}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-card-foreground">
                  Suggested Answer
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    navigator.clipboard.writeText(clause.suggestedAnswer)
                  }
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {clause.suggestedAnswer}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ClauseIntelligencePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Clause Intelligence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-extracted clauses with similarity scores, confidence levels, and
          suggested responses.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-card-foreground">
              {clauses.length}
            </p>
            <p className="text-xs text-muted-foreground">Clauses Extracted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-card-foreground">
              {Math.round(
                clauses.reduce((a, c) => a + c.similarityScore, 0) /
                  clauses.length
              )}
              %
            </p>
            <p className="text-xs text-muted-foreground">Avg. Similarity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-card-foreground">
              {Math.round(
                clauses.reduce((a, c) => a + c.confidence, 0) / clauses.length
              )}
              %
            </p>
            <p className="text-xs text-muted-foreground">Avg. Confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Clause cards */}
      <div className="flex flex-col gap-4">
        {clauses.map((clause) => (
          <ClauseCard key={clause.id} clause={clause} />
        ))}
      </div>
    </div>
  )
}
