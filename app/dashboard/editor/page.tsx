"use client"

import { useState } from "react"
import { Wand2, Save, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

type Section = {
  id: string
  title: string
  status: "empty" | "draft" | "final"
  content: string
}

const initialSections: Section[] = [
  {
    id: "exec-summary",
    title: "Executive Summary",
    status: "draft",
    content:
      "Our organization brings over a decade of experience in delivering enterprise-grade solutions that align with your strategic objectives. We understand the critical nature of this engagement and are committed to providing a solution that exceeds your expectations in terms of quality, security, and scalability.",
  },
  {
    id: "tech-approach",
    title: "Technical Approach",
    status: "draft",
    content:
      "Our proposed architecture leverages a microservices-based design deployed on cloud-native infrastructure. The solution provides horizontal scalability, automated failover, and comprehensive monitoring. Key technologies include Kubernetes orchestration, event-driven processing, and real-time analytics pipelines.",
  },
  {
    id: "security",
    title: "Security & Compliance",
    status: "empty",
    content: "",
  },
  {
    id: "pricing",
    title: "Pricing & Timeline",
    status: "empty",
    content: "",
  },
  {
    id: "team",
    title: "Team & Qualifications",
    status: "empty",
    content: "",
  },
]

export default function DraftEditorPage() {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [activeSection, setActiveSection] = useState<string>(
    initialSections[0].id
  )
  const [generating, setGenerating] = useState(false)

  const active = sections.find((s) => s.id === activeSection)

  const updateContent = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, content, status: content ? "draft" : "empty" }
          : s
      )
    )
  }

  const generateDraft = () => {
    if (!active) return
    setGenerating(true)
    const draftContent: Record<string, string> = {
      "security":
        "Our platform maintains SOC2 Type II certification with continuous monitoring and annual third-party audits. All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We implement role-based access control (RBAC), multi-factor authentication, and maintain comprehensive audit logs for all system activities. Our security team conducts quarterly penetration testing and vulnerability assessments.",
      "pricing":
        "We propose a phased implementation approach over 16 weeks:\n\nPhase 1 (Weeks 1-4): Discovery & Architecture Design - $45,000\nPhase 2 (Weeks 5-10): Core Development & Integration - $120,000\nPhase 3 (Weeks 11-14): Testing & QA - $35,000\nPhase 4 (Weeks 15-16): Deployment & Training - $25,000\n\nTotal Project Investment: $225,000\nAnnual Support & Maintenance: $45,000/year",
      "team":
        "Our delivery team comprises senior professionals with deep domain expertise:\n\n- Project Lead: 15+ years enterprise delivery experience\n- Solutions Architect: AWS/Azure certified, 10+ years\n- Lead Developer: Full-stack expertise, security clearance\n- QA Lead: Automated testing specialist, ISTQB certified\n- DevOps Engineer: CI/CD pipeline and cloud infrastructure expert\n\nOur team has successfully delivered 50+ projects of similar scope and complexity.",
    }

    setTimeout(() => {
      if (active.content === "" && draftContent[active.id]) {
        updateContent(active.id, draftContent[active.id])
      }
      setGenerating(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Draft Editor
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit and finalize your AI-generated proposal responses
          section-by-section.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Section list */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-card-foreground">
              Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{section.title}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        section.status === "final"
                          ? "default"
                          : section.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {section.status}
                    </Badge>
                    {activeSection === section.id && (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        {active && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-card-foreground">
                    {active.title}
                  </CardTitle>
                  <CardDescription>
                    Edit the content below or generate an AI draft.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateDraft}
                    disabled={generating}
                  >
                    <Wand2 className="mr-1 h-3.5 w-3.5" />
                    {generating ? "Generating..." : "AI Generate"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      setSections((prev) =>
                        prev.map((s) =>
                          s.id === active.id ? { ...s, status: "final" } : s
                        )
                      )
                    }
                    disabled={!active.content}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Finalize
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={active.content}
                onChange={(e) => updateContent(active.id, e.target.value)}
                placeholder="Start writing or use AI Generate to create a draft..."
                className="min-h-[400px] resize-y text-sm leading-relaxed"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
