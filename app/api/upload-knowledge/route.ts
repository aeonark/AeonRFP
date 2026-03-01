import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/smartmatch/embedding'
import { normalizeClause } from '@/lib/smartmatch/normalize'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const tenantId = formData.get('tenant_id') as string | null
        const documentType = formData.get('document_type') as string || 'rfp_response'

        if (!file || !tenantId) {
            return NextResponse.json(
                { error: 'Missing file or tenant_id' },
                { status: 400 }
            )
        }

        // Upload to storage
        const fileName = `knowledge/${tenantId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
            .from('knowledge-documents')
            .upload(fileName, file)

        if (uploadError) {
            return NextResponse.json(
                { error: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            )
        }

        const { data: urlData } = supabase.storage
            .from('knowledge-documents')
            .getPublicUrl(fileName)

        // Hash for dedup
        const arrayBuffer = await file.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        const fileHash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')

        // Check duplicate
        const { data: existing } = await supabase
            .from('knowledge_documents')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('file_hash', fileHash)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'This document has already been uploaded.' },
                { status: 409 }
            )
        }

        // Save metadata
        const { data: doc, error: dbError } = await supabase
            .from('knowledge_documents')
            .insert({
                tenant_id: tenantId,
                name: file.name,
                file_url: urlData.publicUrl,
                file_hash: fileHash,
                processed: false,
            })
            .select()
            .single()

        if (dbError) throw dbError

        // Process in background: extract, chunk, embed
        processKnowledgeDocument(doc.id, tenantId, urlData.publicUrl).catch(console.error)

        return NextResponse.json({
            success: true,
            document_id: doc.id,
            message: 'Knowledge document uploaded. Processing will begin shortly.',
        })
    } catch (error) {
        console.error('Upload knowledge error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function processKnowledgeDocument(
    documentId: string,
    tenantId: string,
    fileUrl: string
) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    try {
        // Extract text (placeholder — use pdf-parse / mammoth in production)
        const text = await extractDocumentText(fileUrl)

        // Chunk text into 500–800 token blocks
        const chunks = chunkText(text, 500, 800)

        // Process each chunk
        for (const chunk of chunks) {
            const normalized = normalizeClause(chunk)
            const embedding = await generateEmbedding(normalized)

            // Store chunk in DB
            await supabase.from('knowledge_chunks').insert({
                tenant_id: tenantId,
                document_id: documentId,
                chunk_text: normalized,
                clause_type: 'general',
            })

            // In production: store embedding in Qdrant namespace tenant_{tenantId}
            void embedding // Used for Qdrant storage
        }

        // Mark as processed
        await supabase
            .from('knowledge_documents')
            .update({ processed: true })
            .eq('id', documentId)
    } catch (error) {
        console.error('Knowledge processing error:', error)
    }
}

async function extractDocumentText(fileUrl: string): Promise<string> {
    // Placeholder — integrate with document parsing service
    console.log('Extracting knowledge document text:', fileUrl)
    return 'Sample knowledge document content for processing.'
}

function chunkText(text: string, minTokens: number, maxTokens: number): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    let current: string[] = []

    for (const word of words) {
        current.push(word)
        if (current.length >= maxTokens) {
            chunks.push(current.join(' '))
            current = []
        }
    }
    if (current.length >= minTokens || (current.length > 0 && chunks.length === 0)) {
        chunks.push(current.join(' '))
    }

    return chunks
}
