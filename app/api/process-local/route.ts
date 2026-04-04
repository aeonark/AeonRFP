/**
 * API Route: /api/process-local
 *
 * Server-side document processing that works without Supabase.
 * Receives a file, parses it, extracts clauses, classifies them,
 * and returns the results for the client to store in localStorage.
 *
 * Pipeline:
 *   1. Receive file via FormData
 *   2. Detect file type
 *   3. Extract raw text (PDF/DOCX/XLSX)
 *   4. Normalize text
 *   5. Split into logical clauses
 *   6. Classify each clause type
 *   7. Assess risk for each clause
 *   8. Return structured results
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    detectFileType,
    extractTextFromBuffer,
    splitIntoClauses,
} from '@/lib/parsing/document-parser'
import { normalizeClause } from '@/lib/smartmatch/normalize'
import { classifyClause, assessRisk } from '@/lib/classification/classify'

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Use PDF, DOCX, or XLSX.' },
                { status: 400 }
            )
        }

        // Validate size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File exceeds 50MB limit.' },
                { status: 400 }
            )
        }

        console.log(`[process-local] Processing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)

        // -----------------------------------
        // 1. Read file into buffer
        // -----------------------------------
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // -----------------------------------
        // 2. Detect file type
        // -----------------------------------
        const fileType = detectFileType(file.name)
        if (!fileType) {
            return NextResponse.json(
                { error: 'Could not detect file type from filename.' },
                { status: 400 }
            )
        }

        console.log(`[process-local] File type: ${fileType}`)

        // -----------------------------------
        // 3. Extract text
        // -----------------------------------
        const parseResult = await extractTextFromBuffer(fileBuffer, fileType)

        if (!parseResult.text || parseResult.text.trim().length < 20) {
            return NextResponse.json(
                { error: 'Could not extract meaningful text from this document. It may be image-based or empty.' },
                { status: 422 }
            )
        }

        console.log(
            `[process-local] Extracted ${parseResult.text.length} characters` +
            (parseResult.pageCount ? `, ${parseResult.pageCount} pages` : '')
        )

        // -----------------------------------
        // 4. Split into clauses
        // -----------------------------------
        const rawClauses = splitIntoClauses(parseResult.text)

        if (rawClauses.length === 0) {
            return NextResponse.json(
                { error: 'No clauses could be extracted from this document.' },
                { status: 422 }
            )
        }

        console.log(`[process-local] Split into ${rawClauses.length} clauses`)

        // -----------------------------------
        // 5. Normalize, classify, assess risk
        // -----------------------------------
        const processedClauses = rawClauses.map((clause) => {
            const normalizedText = normalizeClause(clause.text)
            const classification = classifyClause(normalizedText)
            const risk = assessRisk(normalizedText, classification.type)

            return {
                clause_index: clause.index,
                clause_text: normalizedText,
                clause_type: classification.type,
                confidence_score: classification.confidence,
                risk_flag: risk,
                status: 'pending' as const,
                generated_answer: null,
                reasoning_summary: null,
            }
        })

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)

        console.log(
            `[process-local] ✓ Complete | File: ${file.name} | ` +
            `Clauses: ${processedClauses.length} | Duration: ${duration}s`
        )

        return NextResponse.json({
            success: true,
            file_name: file.name,
            file_size: file.size,
            text_length: parseResult.text.length,
            page_count: parseResult.pageCount || null,
            clauses: processedClauses,
            duration_seconds: parseFloat(duration),
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed'
        console.error('[process-local] Error:', err)

        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
