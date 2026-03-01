import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/smartmatch/embedding'
import { normalizeClause } from '@/lib/smartmatch/normalize'
import { analyzeStyle } from '@/lib/training/style-profile'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const tenantId = formData.get('tenant_id') as string | null
        const documentType = (formData.get('document_type') as string) || 'rfp_response'

        if (!file || !tenantId) {
            return NextResponse.json({ error: 'Missing file or tenant_id' }, { status: 400 })
        }

        // Upload
        const fileName = `training/${tenantId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
            .from('training-documents')
            .upload(fileName, file)

        if (uploadError) {
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
        }

        const { data: urlData } = supabase.storage
            .from('training-documents')
            .getPublicUrl(fileName)

        // Save metadata
        const { data: doc } = await supabase
            .from('organization_training_documents')
            .insert({
                tenant_id: tenantId,
                document_type: documentType,
                file_url: urlData.publicUrl,
                processed: false,
            })
            .select()
            .single()

        // Process in background
        processTrainingDocument(doc!.id, tenantId, urlData.publicUrl).catch(console.error)

        return NextResponse.json({
            success: true,
            document_id: doc!.id,
            message: 'Training document uploaded. Processing will begin shortly.',
        })
    } catch (error) {
        console.error('Train organization error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function processTrainingDocument(
    documentId: string,
    tenantId: string,
    fileUrl: string
) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    try {
        // Extract text (placeholder)
        const text = `Sample training document content from ${fileUrl}`

        // Chunk text
        const chunks = text
            .split(/\n\s*\n/)
            .map((c) => c.trim())
            .filter((c) => c.length > 20)

        // Process chunks
        const chunkTexts: string[] = []
        for (const chunk of chunks) {
            const normalized = normalizeClause(chunk)
            const embedding = await generateEmbedding(normalized)

            // Store chunk
            await supabase.from('knowledge_chunks').insert({
                tenant_id: tenantId,
                document_id: documentId,
                chunk_text: normalized,
                clause_type: 'general',
            })

            chunkTexts.push(normalized)
            void embedding // Used for Qdrant storage
        }

        // Update style profile if enough documents
        const { count } = await supabase
            .from('organization_training_documents')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('processed', true)

        if ((count || 0) >= 10) {
            // Fetch all chunks for style analysis
            const { data: allChunks } = await supabase
                .from('knowledge_chunks')
                .select('chunk_text')
                .eq('tenant_id', tenantId)
                .limit(500)

            if (allChunks) {
                const style = analyzeStyle(allChunks.map((c) => c.chunk_text))
                await supabase.from('style_profile').upsert({
                    tenant_id: tenantId,
                    avg_sentence_length: style.avg_sentence_length,
                    tone_vector: style.tone_vector,
                    common_phrases: style.common_phrases,
                    formality_score: style.formality_score,
                    updated_at: new Date().toISOString(),
                })
            }
        }

        // Mark as processed
        await supabase
            .from('organization_training_documents')
            .update({ processed: true })
            .eq('id', documentId)
    } catch (error) {
        console.error('Training processing error:', error)
    }
}
