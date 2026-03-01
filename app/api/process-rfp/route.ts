import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeClause } from '@/lib/smartmatch/normalize'
import { generateEmbedding } from '@/lib/smartmatch/embedding'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { rfp_id, tenant_id } = await request.json()

        if (!rfp_id || !tenant_id) {
            return NextResponse.json(
                { error: 'Missing rfp_id or tenant_id' },
                { status: 400 }
            )
        }

        // Update status to processing
        await supabase
            .from('rfp_documents')
            .update({ status: 'processing' })
            .eq('id', rfp_id)
            .eq('tenant_id', tenant_id)

        // Get RFP document
        const { data: rfpDoc, error: fetchError } = await supabase
            .from('rfp_documents')
            .select('*')
            .eq('id', rfp_id)
            .eq('tenant_id', tenant_id)
            .single()

        if (fetchError || !rfpDoc) {
            return NextResponse.json(
                { error: 'RFP document not found' },
                { status: 404 }
            )
        }

        try {
            // Step 1: Extract text from document
            // In production, use a document parsing service (e.g., Apache Tika, pdf-parse)
            // For MVP, we simulate text extraction
            const extractedText = await extractText(rfpDoc.file_url)

            // Step 2: Split into logical clauses
            const rawClauses = splitIntoClauses(extractedText)

            // Step 3: Store clauses and generate embeddings
            const clauseRecords = rawClauses.map((text, index) => ({
                rfp_id,
                tenant_id,
                clause_text: normalizeClause(text),
                clause_index: index + 1,
                clause_type: 'general' as const,
            }))

            const { data: insertedClauses, error: insertError } = await supabase
                .from('clauses')
                .insert(clauseRecords)
                .select()

            if (insertError) throw insertError

            // Step 4: Generate embeddings for each clause (batch processing)
            const BATCH_SIZE = 5
            for (let i = 0; i < (insertedClauses?.length || 0); i += BATCH_SIZE) {
                const batch = insertedClauses!.slice(i, i + BATCH_SIZE)
                await Promise.all(
                    batch.map(async (clause) => {
                        try {
                            await generateEmbedding(clause.clause_text)
                            // In production, store in Qdrant with tenant namespace
                        } catch (err) {
                            console.error(`Embedding failed for clause ${clause.id}:`, err)
                        }
                    })
                )
            }

            // Update status to completed
            await supabase
                .from('rfp_documents')
                .update({
                    status: 'completed',
                    clause_count: insertedClauses?.length || 0,
                })
                .eq('id', rfp_id)

            return NextResponse.json({
                success: true,
                rfp_id,
                clauses_processed: insertedClauses?.length || 0,
            })
        } catch (processingError) {
            // Update status to failed
            await supabase
                .from('rfp_documents')
                .update({ status: 'failed' })
                .eq('id', rfp_id)

            throw processingError
        }
    } catch (error) {
        console.error('Process RFP error:', error)
        return NextResponse.json(
            { error: 'Processing failed' },
            { status: 500 }
        )
    }
}

// ============================================
// Text extraction (placeholder)
// ============================================

async function extractText(fileUrl: string): Promise<string> {
    // In production, download the file and use:
    // - pdf-parse for PDFs
    // - mammoth for DOCX
    // - xlsx for spreadsheets
    // For MVP, return sample text
    console.log('Extracting text from:', fileUrl)
    return `
    1.0 Executive Summary
    The vendor shall provide a comprehensive cybersecurity solution.

    2.1 Technical Requirements
    The vendor shall demonstrate compliance with NIST SP 800-53 Rev 5 security controls.

    2.2 Data Encryption
    Describe your approach to data encryption at rest and in transit.

    3.0 Compliance
    Provide evidence of SOC 2 Type II certification.

    4.0 Pricing
    Provide detailed pricing for a 3-year engagement.

    5.0 Past Performance
    Describe three similar contracts completed in the last 5 years.
  `
}

// ============================================
// Clause splitting logic
// ============================================

function splitIntoClauses(text: string): string[] {
    // Split by section patterns (numbered headings, double newlines, etc.)
    const sections = text
        .split(/\n\s*(?=\d+\.[\d.]*\s)/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20)

    // If no structured sections found, split by paragraphs
    if (sections.length <= 1) {
        return text
            .split(/\n\s*\n/)
            .map((s) => s.trim())
            .filter((s) => s.length > 20)
    }

    return sections
}
