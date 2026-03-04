/**
 * API Route: /api/process-rfp
 *
 * Real document processing pipeline:
 *   1. Download file from Supabase Storage
 *   2. Detect file type (PDF / DOCX / XLSX)
 *   3. Extract raw text
 *   4. Normalize extracted text
 *   5. Split into logical clauses
 *   6. Store clauses in Supabase
 *   7. Update RFP document status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    detectFileType,
    extractTextFromBuffer,
    splitIntoClauses,
} from '@/lib/parsing/document-parser'
import { normalizeClause } from '@/lib/smartmatch/normalize'
import { generateEmbedding } from '@/lib/smartmatch/embedding'

// ============================================
// Types
// ============================================

interface ProcessRequest {
    rfp_id: string
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // -----------------------------------
        // 1. Parse and validate request
        // -----------------------------------
        const body = (await request.json()) as ProcessRequest
        const { rfp_id } = body

        if (!rfp_id) {
            return NextResponse.json(
                { error: 'Missing required field: rfp_id' },
                { status: 400 }
            )
        }

        console.log(`[process-rfp] Starting processing for RFP: ${rfp_id}`)

        const supabase = await createClient()

        // -----------------------------------
        // 2. Fetch RFP document record
        // -----------------------------------
        const { data: rfpDoc, error: fetchError } = await supabase
            .from('rfp_documents')
            .select('*')
            .eq('id', rfp_id)
            .single()

        if (fetchError || !rfpDoc) {
            console.error(`[process-rfp] RFP not found: ${rfp_id}`, fetchError)
            return NextResponse.json(
                { error: 'RFP document not found' },
                { status: 404 }
            )
        }

        // -----------------------------------
        // 3. Update status → processing
        // -----------------------------------
        await supabase
            .from('rfp_documents')
            .update({ status: 'processing' })
            .eq('id', rfp_id)

        console.log(`[process-rfp] Status → processing | File: ${rfpDoc.file_url}`)

        // -----------------------------------
        // 4. Download file from Supabase Storage
        // -----------------------------------
        const fileUrl: string = rfpDoc.file_url
        let fileBuffer: Buffer

        try {
            // If the file_url is a Supabase Storage path (e.g., "rfp-uploads/tenant/file.pdf"),
            // download via the Supabase Storage API.
            // If it's a full URL, fetch directly.
            if (fileUrl.startsWith('http')) {
                const response = await fetch(fileUrl)
                if (!response.ok) {
                    throw new Error(`Failed to download file: HTTP ${response.status}`)
                }
                const arrayBuffer = await response.arrayBuffer()
                fileBuffer = Buffer.from(arrayBuffer)
            } else {
                // Supabase Storage path
                const { data: fileData, error: downloadError } = await supabase
                    .storage
                    .from('rfp-uploads')
                    .download(fileUrl)

                if (downloadError || !fileData) {
                    throw new Error(
                        `Supabase Storage download failed: ${downloadError?.message || 'No data returned'}`
                    )
                }

                const arrayBuffer = await fileData.arrayBuffer()
                fileBuffer = Buffer.from(arrayBuffer)
            }

            console.log(`[process-rfp] File downloaded: ${(fileBuffer.length / 1024).toFixed(1)} KB`)
        } catch (downloadErr) {
            console.error(`[process-rfp] Download failed for ${rfp_id}:`, downloadErr)
            await markFailed(supabase, rfp_id, 'Failed to download document from storage')
            return NextResponse.json(
                { error: 'Failed to download document from storage' },
                { status: 500 }
            )
        }

        // -----------------------------------
        // 5. Detect file type
        // -----------------------------------
        const fileType = detectFileType(fileUrl)
        if (!fileType) {
            console.error(`[process-rfp] Unsupported file type for: ${fileUrl}`)
            await markFailed(supabase, rfp_id, 'Unsupported file type. Use PDF, DOCX, or XLSX.')
            return NextResponse.json(
                { error: 'Unsupported file type. Use PDF, DOCX, or XLSX.' },
                { status: 400 }
            )
        }

        console.log(`[process-rfp] Detected file type: ${fileType}`)

        // -----------------------------------
        // 6. Extract raw text
        // -----------------------------------
        let extractedText: string

        try {
            const parseResult = await extractTextFromBuffer(fileBuffer, fileType)
            extractedText = parseResult.text

            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error(
                    'Extracted text is too short — document may be image-based or empty'
                )
            }

            console.log(
                `[process-rfp] Text extracted: ${extractedText.length} characters` +
                (parseResult.pageCount ? `, ${parseResult.pageCount} pages` : '')
            )
        } catch (extractErr) {
            const message = extractErr instanceof Error ? extractErr.message : 'Text extraction failed'
            console.error(`[process-rfp] Extraction failed for ${rfp_id}:`, extractErr)
            await markFailed(supabase, rfp_id, message)
            return NextResponse.json(
                { error: message },
                { status: 500 }
            )
        }

        // -----------------------------------
        // 7. Split into clauses
        // -----------------------------------
        const rawClauses = splitIntoClauses(extractedText)

        if (rawClauses.length === 0) {
            console.error(`[process-rfp] No clauses extracted from RFP: ${rfp_id}`)
            await markFailed(supabase, rfp_id, 'No clauses could be extracted from this document')
            return NextResponse.json(
                { error: 'No clauses could be extracted from this document' },
                { status: 422 }
            )
        }

        console.log(`[process-rfp] Split into ${rawClauses.length} clauses`)

        // -----------------------------------
        // 8. Normalize and store clauses
        // -----------------------------------
        const clauseRecords = rawClauses.map((clause) => ({
            rfp_id,
            clause_text: normalizeClause(clause.text),
            clause_index: clause.index,
            clause_type: 'general' as const,
            status: 'pending' as const,
        }))

        const { error: insertError } = await supabase
            .from('clauses')
            .insert(clauseRecords)

        if (insertError) {
            console.error(`[process-rfp] Clause insert failed for ${rfp_id}:`, insertError)
            await markFailed(supabase, rfp_id, 'Failed to store extracted clauses')
            return NextResponse.json(
                { error: 'Failed to store clauses in database' },
                { status: 500 }
            )
        }

        console.log(`[process-rfp] ${clauseRecords.length} clauses stored in database`)

        // -----------------------------------
        // 9. Generate embeddings (batched)
        // -----------------------------------
        const BATCH_SIZE = 5
        let embeddingsGenerated = 0

        for (let i = 0; i < clauseRecords.length; i += BATCH_SIZE) {
            const batch = clauseRecords.slice(i, i + BATCH_SIZE)

            const embedPromises = batch.map(async (clause) => {
                try {
                    await generateEmbedding(clause.clause_text)
                    embeddingsGenerated++
                } catch (embErr) {
                    // Log but don't fail the whole pipeline for individual embedding failures
                    console.warn(
                        `[process-rfp] Embedding failed for clause ${clause.clause_index}:`,
                        embErr
                    )
                }
            })

            await Promise.all(embedPromises)

            // Small delay between batches to respect rate limits
            if (i + BATCH_SIZE < clauseRecords.length) {
                await new Promise((resolve) => setTimeout(resolve, 200))
            }
        }

        console.log(
            `[process-rfp] Embeddings generated: ${embeddingsGenerated}/${clauseRecords.length}`
        )

        // -----------------------------------
        // 10. Update status → completed
        // -----------------------------------
        await supabase
            .from('rfp_documents')
            .update({
                status: 'completed',
                clause_count: clauseRecords.length,
            })
            .eq('id', rfp_id)

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)

        console.log(
            `[process-rfp] ✓ Complete | RFP: ${rfp_id} | ` +
            `Clauses: ${clauseRecords.length} | ` +
            `Embeddings: ${embeddingsGenerated} | ` +
            `Duration: ${duration}s`
        )

        return NextResponse.json({
            success: true,
            rfp_id,
            clauses_extracted: clauseRecords.length,
            embeddings_generated: embeddingsGenerated,
            duration_seconds: parseFloat(duration),
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[process-rfp] Unhandled error:', err)

        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}

// ============================================
// Helpers
// ============================================

/**
 * Mark an RFP as failed with an error message.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markFailed(supabase: any, rfpId: string, errorMessage: string) {
    try {
        await supabase
            .from('rfp_documents')
            .update({
                status: 'failed',
                error_message: errorMessage,
            })
            .eq('id', rfpId)

        console.log(`[process-rfp] Status → failed | RFP: ${rfpId} | Reason: ${errorMessage}`)
    } catch (updateErr) {
        console.error(`[process-rfp] Failed to update status for ${rfpId}:`, updateErr)
    }
}
