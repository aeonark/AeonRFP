'use client'

import { useState } from 'react'
import {
    FileEdit,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    Loader2,
    Copy,
    RotateCcw,
    Send,
} from 'lucide-react'

interface Section {
    id: string
    title: string
    clauseRef: string
    status: 'pending' | 'generating' | 'complete'
    content: string
}

const initialSections: Section[] = [
    {
        id: '1',
        title: 'Executive Summary',
        clauseRef: 'Section 1.0',
        status: 'complete',
        content:
            'Aeonark Labs is pleased to submit this proposal in response to the Department of Defense Cybersecurity Framework RFP. Our organization brings over a decade of experience in delivering enterprise-grade cybersecurity solutions to federal agencies. Our approach combines advanced AI-driven threat detection with proven compliance frameworks to deliver comprehensive security posture management.\n\nWe are uniquely positioned to meet the requirements outlined in this solicitation through our certified SOC operations, NIST-aligned security controls, and patented SmartMatch technology that enables real-time threat correlation.',
    },
    {
        id: '2',
        title: 'Technical Approach',
        clauseRef: 'Section 2.1–2.4',
        status: 'complete',
        content:
            'Our technical approach leverages a multi-layered security architecture built on zero-trust principles. The solution includes:\n\n1. Continuous monitoring through our 24/7 Security Operations Center\n2. Automated vulnerability assessment and remediation workflows\n3. Advanced threat intelligence integration using machine learning models\n4. Encrypted data handling with AES-256 at rest and TLS 1.3 in transit\n\nAll components are designed for seamless integration with existing DoD infrastructure and comply with FedRAMP High baseline requirements.',
    },
    {
        id: '3',
        title: 'Compliance & Certifications',
        clauseRef: 'Section 3.0',
        status: 'generating',
        content: 'Our compliance framework is built around NIST SP 800-53 Rev 5 controls...',
    },
    {
        id: '4',
        title: 'Pricing & Cost Structure',
        clauseRef: 'Section 4.0',
        status: 'pending',
        content: '',
    },
    {
        id: '5',
        title: 'Past Performance',
        clauseRef: 'Section 5.0',
        status: 'pending',
        content: '',
    },
]

export default function EditorPage() {
    const [sections, setSections] = useState<Section[]>(initialSections)
    const [activeId, setActiveId] = useState<string>('1')
    const [editContent, setEditContent] = useState<string>(initialSections[0].content)

    const activeSection = sections.find((s) => s.id === activeId)

    function selectSection(id: string) {
        setActiveId(id)
        const section = sections.find((s) => s.id === id)
        setEditContent(section?.content || '')
    }

    function generateSection(id: string) {
        setSections((prev) =>
            prev.map((s) =>
                s.id === id ? { ...s, status: 'generating' } : s
            )
        )
        // Simulate streaming generation
        setTimeout(() => {
            const generated =
                'Based on our analysis of previous successful proposals and the specific requirements outlined in this section, we recommend the following approach...\n\nOur organization has maintained an exemplary track record of performance across multiple federal contracts of similar scope and complexity. Key highlights include on-time delivery rates exceeding 98%, customer satisfaction scores averaging 4.8/5.0, and zero security incidents across all managed environments.'
            setSections((prev) =>
                prev.map((s) =>
                    s.id === id
                        ? { ...s, status: 'complete', content: generated }
                        : s
                )
            )
            if (id === activeId) {
                setEditContent(generated)
            }
        }, 3000)
    }

    function handleSave() {
        setSections((prev) =>
            prev.map((s) =>
                s.id === activeId ? { ...s, content: editContent } : s
            )
        )
    }

    return (
        <div className="h-[calc(100vh-7rem)] flex gap-6 animate-fade-in">
            {/* Section nav */}
            <div className="w-72 shrink-0 space-y-2 overflow-y-auto">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileEdit className="w-5 h-5" />
                    Draft Editor
                </h2>
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => selectSection(section.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${activeId === section.id
                                ? 'glass-card border-aeon-blue/30'
                                : 'hover:bg-secondary/50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {section.status === 'complete' && (
                                <CheckCircle2 className="w-4 h-4 text-aeon-emerald shrink-0" />
                            )}
                            {section.status === 'generating' && (
                                <Loader2 className="w-4 h-4 text-aeon-blue animate-spin shrink-0" />
                            )}
                            {section.status === 'pending' && (
                                <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {section.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {section.clauseRef}
                                </div>
                            </div>
                            {activeId === section.id && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                        </div>
                    </button>
                ))}

                {/* Generate all button */}
                <button
                    onClick={() => {
                        sections
                            .filter((s) => s.status === 'pending')
                            .forEach((s) => generateSection(s.id))
                    }}
                    className="w-full mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-sm font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles className="w-4 h-4" />
                    Generate All Pending
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
                {activeSection ? (
                    <>
                        {/* Editor header */}
                        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold">{activeSection.title}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {activeSection.clauseRef}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeSection.status === 'pending' && (
                                    <button
                                        onClick={() => generateSection(activeSection.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aeon-blue/10 text-aeon-blue text-xs font-medium hover:bg-aeon-blue/15 transition-colors"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Generate
                                    </button>
                                )}
                                {activeSection.status === 'generating' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aeon-blue/10 text-aeon-blue text-xs font-medium">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Generating...
                                    </div>
                                )}
                                <button
                                    onClick={() => navigator.clipboard.writeText(editContent)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    title="Copy"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => generateSection(activeSection.id)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    title="Regenerate"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Text area */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onBlur={handleSave}
                                placeholder={
                                    activeSection.status === 'pending'
                                        ? 'Click "Generate" to create AI-powered content, or type your response manually...'
                                        : 'Edit your response...'
                                }
                                className="w-full h-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {editContent.split(/\s+/).filter(Boolean).length} words
                            </span>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-aeon-emerald text-white text-xs font-semibold hover:bg-aeon-emerald/90 transition-colors"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Save Section
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        Select a section to start editing
                    </div>
                )}
            </div>
        </div>
    )
}
