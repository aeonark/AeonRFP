'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
    ArrowRight,
    Brain,
    FileSearch,
    BarChart3,
    Shield,
    Zap,
    Layers,
    Sparkles,
    ChevronRight,
    Upload,
} from 'lucide-react'

function AnimatedOrb({ className }: { className?: string }) {
    return (
        <div
            className={`absolute rounded-full animate-pulse-glow pointer-events-none ${className}`}
        />
    )
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    delay,
}: {
    icon: React.ElementType
    title: string
    description: string
    delay: number
}) {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    return (
        <div
            className={`glass-card rounded-xl p-6 transition-all duration-700 hover:scale-[1.03] hover:border-aeon-blue/30 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
        >
            <div className="w-11 h-11 rounded-lg bg-aeon-blue/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-aeon-blue" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center">
            <div className="text-3xl font-bold gradient-text">{value}</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
    )
}

export default function LandingPage() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Ambient background */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none" />
            <AnimatedOrb className="w-[600px] h-[600px] bg-aeon-blue/8 top-[-200px] left-[-100px]" />
            <AnimatedOrb className="w-[500px] h-[500px] bg-aeon-violet/6 bottom-[-150px] right-[-100px]" />

            {/* Navigation */}
            <nav className="relative z-10 border-b border-border/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aeon-blue to-aeon-violet flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">AeonRFP</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
                        <a href="#metrics" className="hover:text-foreground transition-colors">Results</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="text-sm px-4 py-2 rounded-lg bg-aeon-blue text-white font-medium hover:bg-aeon-blue/90 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
                <div
                    className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aeon-blue/10 border border-aeon-blue/20 text-aeon-blue text-sm font-medium mb-8">
                        <Zap className="w-3.5 h-3.5" />
                        AI-Powered RFP Intelligence
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                        Win More Proposals
                        <br />
                        <span className="gradient-text">With Intelligent AI</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        AeonRFP analyzes your historical responses, matches clauses with
                        precision, and generates enterprise-grade proposals in minutes — not
                        weeks.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold text-base hover:shadow-lg hover:shadow-aeon-blue/20 transition-all duration-300 hover:scale-[1.02]"
                        >
                            Start Free Trial
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-medium text-base hover:bg-secondary transition-all"
                        >
                            View Dashboard Demo
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div
                    className={`mt-20 relative max-w-5xl mx-auto transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                        }`}
                >
                    <div className="glass-card rounded-2xl p-1 border border-border/40">
                        <div className="rounded-xl bg-card overflow-hidden">
                            {/* Mock dashboard header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                                <div className="w-3 h-3 rounded-full bg-chart-4/60" />
                                <div className="w-3 h-3 rounded-full bg-chart-2/60" />
                                <span className="ml-3 text-xs text-muted-foreground">AeonRFP Dashboard</span>
                            </div>
                            {/* Mock dashboard content */}
                            <div className="p-6 grid grid-cols-3 gap-4 min-h-[300px]">
                                {/* Sidebar mock */}
                                <div className="col-span-1 space-y-3">
                                    {['Upload RFP', 'Clause Intelligence', 'Draft Editor', 'Analytics'].map(
                                        (item, i) => (
                                            <div
                                                key={item}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${i === 0
                                                        ? 'bg-aeon-blue/10 text-aeon-blue'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                {i === 0 && <Upload className="w-4 h-4" />}
                                                {i === 1 && <Brain className="w-4 h-4" />}
                                                {i === 2 && <FileSearch className="w-4 h-4" />}
                                                {i === 3 && <BarChart3 className="w-4 h-4" />}
                                                {item}
                                            </div>
                                        )
                                    )}
                                </div>
                                {/* Content mock */}
                                <div className="col-span-2 space-y-4">
                                    <div className="flex gap-4">
                                        {[
                                            { label: 'Active RFPs', value: '12' },
                                            { label: 'Win Rate', value: '78%' },
                                            { label: 'Avg Confidence', value: '91' },
                                        ].map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="flex-1 glass-card rounded-lg p-4"
                                            >
                                                <div className="text-2xl font-bold gradient-text">
                                                    {stat.value}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {stat.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="glass-card rounded-lg p-4 h-36 flex items-center justify-center">
                                        <div className="flex items-center gap-3 text-muted-foreground text-sm">
                                            <div className="w-8 h-8 rounded-full bg-aeon-blue/10 flex items-center justify-center animate-float">
                                                <Sparkles className="w-4 h-4 text-aeon-blue" />
                                            </div>
                                            AI Processing 3 clauses...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Glow effect behind card */}
                    <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-aeon-blue/5 via-aeon-violet/5 to-aeon-cyan/5 blur-2xl" />
                </div>
            </section>

            {/* Features */}
            <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Enterprise-Grade <span className="gradient-text">AI Capabilities</span>
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Purpose-built for proposal teams who need speed, accuracy, and
                        compliance — not generic AI chat.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={Brain}
                        title="SmartMatch Engine"
                        description="Clause-level matching against your historical knowledge base with re-ranking and confidence scoring."
                        delay={100}
                    />
                    <FeatureCard
                        icon={FileSearch}
                        title="Clause Intelligence"
                        description="Automatically parse RFPs into structured clauses, classify types, and surface relevant past responses."
                        delay={200}
                    />
                    <FeatureCard
                        icon={Layers}
                        title="Organization Training"
                        description="Upload past RFPs and company docs to build a private knowledge vault that improves over time."
                        delay={300}
                    />
                    <FeatureCard
                        icon={Zap}
                        title="AI Draft Generation"
                        description="Generate section-by-section responses with streaming output, maintaining your company's tone and style."
                        delay={400}
                    />
                    <FeatureCard
                        icon={BarChart3}
                        title="Proposal Analytics"
                        description="Track win rates, clause reuse patterns, and confidence trends to continuously improve."
                        delay={500}
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Tenant Isolation"
                        description="Enterprise-grade multi-tenant security ensures your data never mixes with other organizations."
                        delay={600}
                    />
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        How <span className="gradient-text">AeonRFP</span> Works
                    </h2>
                </div>
                <div className="grid md:grid-cols-4 gap-8">
                    {[
                        {
                            step: '01',
                            title: 'Upload',
                            desc: 'Drop your RFP document and let AI parse every clause.',
                        },
                        {
                            step: '02',
                            title: 'Match',
                            desc: 'SmartMatch finds the best historical responses instantly.',
                        },
                        {
                            step: '03',
                            title: 'Generate',
                            desc: 'AI drafts compliant, on-tone responses per section.',
                        },
                        {
                            step: '04',
                            title: 'Win',
                            desc: 'Review, refine, and submit — hours saved on every bid.',
                        },
                    ].map((item) => (
                        <div key={item.step} className="text-center">
                            <div className="text-4xl font-bold gradient-text mb-3">
                                {item.step}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Metrics */}
            <section id="metrics" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
                <div className="glass-card rounded-2xl p-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-2">Proven Results</h2>
                        <p className="text-muted-foreground">
                            Teams using AeonRFP close deals faster.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCard value="78%" label="Avg Win Rate" />
                        <StatCard value="12x" label="Faster Drafts" />
                        <StatCard value="91%" label="Confidence Score" />
                        <StatCard value="2.4k+" label="Clauses Matched" />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Ready to <span className="gradient-text">Win More?</span>
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                    Join forward-thinking proposal teams already using AI to gain a
                    competitive edge.
                </p>
                <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all duration-300 hover:scale-[1.02]"
                >
                    Start Your Free Trial
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-border/50 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-aeon-blue to-aeon-violet flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold">AeonRFP</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Aeonark Labs. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
