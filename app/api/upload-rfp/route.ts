import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const tenantId = formData.get('tenant_id') as string | null

        if (!file || !tenantId) {
            return NextResponse.json(
                { error: 'Missing file or tenant_id' },
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

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File exceeds 50MB limit.' },
                { status: 400 }
            )
        }

        // Upload to Supabase Storage
        const fileName = `${tenantId}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('rfp-documents')
            .upload(fileName, file)

        if (uploadError) {
            return NextResponse.json(
                { error: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            )
        }

        const { data: urlData } = supabase.storage
            .from('rfp-documents')
            .getPublicUrl(fileName)

        // Save metadata
        const { data: rfpDoc, error: dbError } = await supabase
            .from('rfp_documents')
            .insert({
                tenant_id: tenantId,
                name: file.name,
                file_url: urlData.publicUrl,
                status: 'uploaded',
            })
            .select()
            .single()

        if (dbError) {
            return NextResponse.json(
                { error: `Database error: ${dbError.message}` },
                { status: 500 }
            )
        }

        // Trigger processing (async — would normally use a queue)
        // For MVP, we return immediately and process in background
        fetch(`${request.nextUrl.origin}/api/process-rfp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rfp_id: rfpDoc.id, tenant_id: tenantId }),
        }).catch(console.error)

        return NextResponse.json({
            success: true,
            rfp_id: rfpDoc.id,
            status: 'uploaded',
            message: 'RFP uploaded successfully. Processing will begin shortly.',
        })
    } catch (error) {
        console.error('Upload RFP error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
