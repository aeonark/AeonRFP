/**
 * API Route: /api/export-proposal
 *
 * Generates a formatted DOCX proposal from an RFP's clauses.
 *
 * Pipeline:
 *   1. Fetch RFP document metadata
 *   2. Fetch all clauses with generated answers
 *   3. Build DOCX with title page + clause sections
 *   4. Return as downloadable file
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    TabStopPosition,
    TabStopType,
    SectionType,
} from 'docx'

export async function GET(request: NextRequest) {
    try {
        // -----------------------------------
        // 1. Parse query params
        // -----------------------------------
        const { searchParams } = new URL(request.url)
        const rfpId = searchParams.get('rfp_id')

        if (!rfpId) {
            return NextResponse.json(
                { error: 'Missing required parameter: rfp_id' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // -----------------------------------
        // 2. Fetch RFP document
        // -----------------------------------
        const { data: rfpDoc, error: rfpErr } = await supabase
            .from('rfp_documents')
            .select('id, title, created_at, status')
            .eq('id', rfpId)
            .single()

        if (rfpErr || !rfpDoc) {
            return NextResponse.json(
                { error: 'RFP document not found' },
                { status: 404 }
            )
        }

        // -----------------------------------
        // 3. Fetch clauses
        // -----------------------------------
        const { data: clauses, error: clauseErr } = await supabase
            .from('clauses')
            .select('clause_index, clause_text, clause_type, generated_answer, confidence_score, risk_flag')
            .eq('rfp_id', rfpId)
            .order('clause_index', { ascending: true })

        if (clauseErr) {
            return NextResponse.json(
                { error: 'Failed to fetch clauses' },
                { status: 500 }
            )
        }

        if (!clauses || clauses.length === 0) {
            return NextResponse.json(
                { error: 'No clauses found for this RFP' },
                { status: 404 }
            )
        }

        // -----------------------------------
        // 4. Build DOCX document
        // -----------------------------------
        const rfpTitle = rfpDoc.title || `RFP #${rfpId.slice(0, 8)}`
        const createdDate = new Date(rfpDoc.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        const answeredCount = clauses.filter((c) => c.generated_answer).length

        const doc = new Document({
            creator: 'AeonRFP',
            title: `${rfpTitle} — AI Generated Response`,
            description: `AI-generated proposal response for ${rfpTitle}`,
            styles: {
                default: {
                    document: {
                        run: {
                            font: 'Calibri',
                            size: 22, // 11pt
                            color: '2D2D2D',
                        },
                        paragraph: {
                            spacing: { after: 120, line: 276 },
                        },
                    },
                    heading1: {
                        run: {
                            font: 'Calibri',
                            size: 32,
                            bold: true,
                            color: '1A1A2E',
                        },
                        paragraph: {
                            spacing: { before: 360, after: 160 },
                        },
                    },
                    heading2: {
                        run: {
                            font: 'Calibri',
                            size: 26,
                            bold: true,
                            color: '16213E',
                        },
                        paragraph: {
                            spacing: { before: 240, after: 120 },
                        },
                    },
                },
            },
            sections: [
                // Title page section
                {
                    properties: {
                        type: SectionType.NEXT_PAGE,
                    },
                    children: [
                        new Paragraph({ spacing: { before: 3000 } }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 },
                            children: [
                                new TextRun({
                                    text: 'AI Generated RFP Response',
                                    bold: true,
                                    size: 48,
                                    color: '4361EE',
                                    font: 'Calibri',
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                            children: [
                                new TextRun({
                                    text: rfpTitle,
                                    size: 32,
                                    color: '555555',
                                    font: 'Calibri',
                                }),
                            ],
                        }),
                        // Divider
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            border: {
                                bottom: {
                                    color: '4361EE',
                                    style: BorderStyle.SINGLE,
                                    size: 2,
                                    space: 1,
                                },
                            },
                            spacing: { after: 400 },
                            children: [],
                        }),
                        // Meta info
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 100 },
                            children: [
                                new TextRun({
                                    text: `Generated: ${createdDate}`,
                                    size: 20,
                                    color: '888888',
                                    font: 'Calibri',
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 100 },
                            children: [
                                new TextRun({
                                    text: `Total Clauses: ${clauses.length} | AI Responses: ${answeredCount}`,
                                    size: 20,
                                    color: '888888',
                                    font: 'Calibri',
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: 'Powered by AeonRFP — AI-Powered Proposal Intelligence',
                                    size: 18,
                                    italics: true,
                                    color: 'AAAAAA',
                                    font: 'Calibri',
                                }),
                            ],
                        }),
                    ],
                },
                // Content section
                {
                    properties: {
                        type: SectionType.NEXT_PAGE,
                    },
                    children: [
                        // Table of Contents header
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            children: [new TextRun({ text: 'Response Sections' })],
                        }),
                        new Paragraph({
                            spacing: { after: 200 },
                            children: [
                                new TextRun({
                                    text: `This document contains ${clauses.length} response sections generated for "${rfpTitle}".`,
                                    size: 22,
                                    color: '666666',
                                }),
                            ],
                        }),
                        // Clause sections
                        ...clauses.flatMap((clause, index) => {
                            const children: Paragraph[] = []

                            // Section heading
                            children.push(
                                new Paragraph({
                                    heading: HeadingLevel.HEADING_2,
                                    children: [
                                        new TextRun({
                                            text: `Section ${clause.clause_index || index + 1}`,
                                        }),
                                        new TextRun({
                                            text: `  [${(clause.clause_type || 'general').toUpperCase()}]`,
                                            size: 18,
                                            color: '4361EE',
                                            bold: false,
                                        }),
                                    ],
                                })
                            )

                            // Confidence + risk badges
                            const badges: string[] = []
                            if (clause.confidence_score) {
                                badges.push(`Confidence: ${clause.confidence_score}%`)
                            }
                            if (clause.risk_flag && clause.risk_flag !== 'low') {
                                badges.push(`Risk: ${clause.risk_flag.toUpperCase()}`)
                            }
                            if (badges.length > 0) {
                                children.push(
                                    new Paragraph({
                                        spacing: { after: 80 },
                                        children: [
                                            new TextRun({
                                                text: badges.join('  |  '),
                                                size: 18,
                                                italics: true,
                                                color: clause.risk_flag === 'high' ? 'CC3333' : '888888',
                                            }),
                                        ],
                                    })
                                )
                            }

                            // Clause text (the requirement)
                            children.push(
                                new Paragraph({
                                    spacing: { after: 60 },
                                    children: [
                                        new TextRun({
                                            text: 'REQUIREMENT:',
                                            bold: true,
                                            size: 18,
                                            color: '999999',
                                        }),
                                    ],
                                })
                            )
                            children.push(
                                new Paragraph({
                                    spacing: { after: 160 },
                                    indent: { left: 360 },
                                    border: {
                                        left: {
                                            color: 'CCCCCC',
                                            style: BorderStyle.SINGLE,
                                            size: 2,
                                            space: 8,
                                        },
                                    },
                                    children: [
                                        new TextRun({
                                            text: clause.clause_text,
                                            size: 21,
                                            color: '555555',
                                            italics: true,
                                        }),
                                    ],
                                })
                            )

                            // Generated response
                            children.push(
                                new Paragraph({
                                    spacing: { after: 60 },
                                    children: [
                                        new TextRun({
                                            text: 'RESPONSE:',
                                            bold: true,
                                            size: 18,
                                            color: '4361EE',
                                        }),
                                    ],
                                })
                            )

                            if (clause.generated_answer) {
                                // Split by paragraphs for better formatting
                                const paragraphs = clause.generated_answer.split('\n').filter((p: string) => p.trim())
                                for (const para of paragraphs) {
                                    children.push(
                                        new Paragraph({
                                            spacing: { after: 100 },
                                            children: [
                                                new TextRun({
                                                    text: para.trim(),
                                                    size: 22,
                                                }),
                                            ],
                                        })
                                    )
                                }
                            } else {
                                children.push(
                                    new Paragraph({
                                        spacing: { after: 100 },
                                        children: [
                                            new TextRun({
                                                text: '[No AI response generated — awaiting processing]',
                                                size: 22,
                                                italics: true,
                                                color: 'AAAAAA',
                                            }),
                                        ],
                                    })
                                )
                            }

                            // Separator between sections
                            children.push(
                                new Paragraph({
                                    border: {
                                        bottom: {
                                            color: 'E0E0E0',
                                            style: BorderStyle.SINGLE,
                                            size: 1,
                                            space: 8,
                                        },
                                    },
                                    spacing: { after: 200 },
                                    children: [],
                                })
                            )

                            return children
                        }),
                    ],
                },
            ],
        })

        // -----------------------------------
        // 5. Generate DOCX buffer
        // -----------------------------------
        const buffer = await Packer.toBuffer(doc)

        // -----------------------------------
        // 6. Return as downloadable file
        // -----------------------------------
        const safeTitle = rfpTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
        const filename = `${safeTitle}_Response.docx`

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(buffer.byteLength),
            },
        })
    } catch (err) {
        console.error('[export-proposal] Error:', err)
        return NextResponse.json(
            { error: 'Failed to generate proposal document' },
            { status: 500 }
        )
    }
}
