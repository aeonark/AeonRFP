"use client"

import Link from "next/link"
import {
  ArrowRight,
  FileText,
  Brain,
  BarChart3,
  Shield,
  Zap,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            AeonRFP
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#metrics"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Results
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/sign-up">
              Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-24">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          AI-Powered Proposal Intelligence
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Win more proposals with intelligent RFP analysis
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          AeonRFP uses AI to analyze requirements, extract key clauses, generate
          draft responses, and surface insights that help your team close deals
          faster.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

const features = [
  {
    icon: Brain,
    title: "Clause Intelligence",
    description:
      "AI extracts and classifies every clause, scoring similarity against your knowledge base for rapid evaluation.",
  },
  {
    icon: FileText,
    title: "Smart Draft Generation",
    description:
      "Generate section-by-section responses with AI that learns from your previous winning proposals.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Track win rates, clause reuse patterns, and team performance with real-time analytics dashboards.",
  },
  {
    icon: Zap,
    title: "Rapid Processing",
    description:
      "Upload any RFP document and get structured analysis in minutes, not hours. Support for PDF, DOCX, and more.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC2 compliant infrastructure with role-based access, audit logging, and data encryption at rest.",
  },
  {
    icon: Target,
    title: "Win Rate Optimization",
    description:
      "Data-driven recommendations on which opportunities to pursue and how to position your response.",
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to win
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            From document upload to submitted proposal, AeonRFP handles every
            step of your RFP workflow.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const steps = [
  {
    step: "01",
    title: "Upload Your RFP",
    description:
      "Drag and drop your RFP document. We support PDF, DOCX, and plain text formats.",
  },
  {
    step: "02",
    title: "AI Analyzes & Extracts",
    description:
      "Our AI reads every clause, requirement, and question, organizing them into structured sections.",
  },
  {
    step: "03",
    title: "Review & Generate Drafts",
    description:
      "Review extracted clauses with confidence scores, then generate AI-powered draft responses.",
  },
  {
    step: "04",
    title: "Submit & Win",
    description:
      "Polish your proposal with the rich editor, export, and track performance analytics.",
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-border bg-muted/50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From document to proposal in four steps
          </h2>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step} className="relative">
              <span className="text-5xl font-bold text-primary/10">
                {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const metrics = [
  { value: "73%", label: "Faster response time" },
  { value: "2.4x", label: "More proposals per quarter" },
  { value: "89%", label: "Clause accuracy" },
  { value: "41%", label: "Win rate improvement" },
]

function MetricsSection() {
  return (
    <section id="metrics" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Results
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Numbers that speak for themselves
          </h2>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="text-center"
            >
              <p className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-12 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to transform your proposal workflow?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Join teams using AeonRFP to win more contracts with less effort. Start
          your free trial today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <FileText className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">AeonRFP</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Built by Aeonark. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MetricsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
