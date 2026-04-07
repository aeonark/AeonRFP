import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as fs from 'fs'
import * as path from 'path'

function logDebug(message: string, data?: any) {
    const logPath = path.join(process.cwd(), 'pipeline.log')
    const timestamp = new Date().toISOString()
    const text = `[${timestamp}] [UPLOAD-RFP] ${message} ${data ? JSON.stringify(data) : ''}\n`
    try { fs.appendFileSync(logPath, text) } catch (e) {}
}

export async function POST(request: NextRequest) {
    try {
        logDebug('1. Upload API Triggered')
        const supabase = await createClient()
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        logDebug('2. File Received:', { size: file?.size, type: file?.type })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            logDebug('3. ERROR: Unauthorized user')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        logDebug('3. User Auth Success:', { id: user.id })

        const { data: userData, error: selectErr } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
        let tenantId = userData?.tenant_id
        logDebug('4. Tenant Resolution:', { tenantId, selectErr })

        // 200 IQ FIX: Lazy Tenant Initialization
        if (!tenantId) {
            logDebug('5. Tenant missing, initiating lazy creation')
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

            // Auto-create a personal tenant
            const { data: newTenant, error: tenantErr } = await supabase.from('tenants').insert({
                company_name: `${fullName}'s Workspace`,
                plan_type: 'starter'
            }).select().single()

            if (tenantErr) {
                logDebug('5a. ERROR: Workspace creation failed:', tenantErr)
                return NextResponse.json(
                    { error: `Workspace creation failed: ${tenantErr.message} (Code: ${tenantErr.code})` },
                    { status: 500 }
                )
            }

            if (newTenant) {
                // Link the user
                const { error: userErr } = await supabase.from('users').insert({
                    id: user.id,
                    email: user.email,
                    full_name: fullName,
                    tenant_id: newTenant.id,
                    role: 'admin'
                })

                if (userErr) {
                    return NextResponse.json(
                        { error: `User profile creation failed: ${userErr.message} (Code: ${userErr.code})` },
                        { status: 500 }
                    )
                }

                tenantId = newTenant.id
            }
        }

        if (!file || !tenantId) {
            logDebug('6. ERROR: Missing file or tenant_id', { hasFile: !!file, tenantId })
            return NextResponse.json(
                { error: `Missing file or tenant_id. DEBUG-> HasFile: ${!!file}, tenantId: ${tenantId}, selectErr: ${selectErr?.message}` },
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
            logDebug('7. ERROR: Unsupported file type', { type: file.type })
            return NextResponse.json(
                { error: 'Unsupported file type. Use PDF, DOCX, or XLSX.' },
                { status: 400 }
            )
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            logDebug('8. ERROR: File exceeds size limit', { size: file.size })
            return NextResponse.json(
                { error: 'File exceeds 50MB limit.' },
                { status: 400 }
            )
        }

        logDebug('9. Starting Supabase Storage Upload')
        const fileName = `${tenantId}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('rfp-documents')
            .upload(fileName, file)

        if (uploadError) {
            logDebug('10. ERROR: Storage upload failed', uploadError)
            return NextResponse.json(
                { error: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            )
        }

        const { data: urlData } = supabase.storage
            .from('rfp-documents')
            .getPublicUrl(fileName)

        logDebug('11. Database row insertion')
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
            logDebug('12. ERROR: Database insert failed', dbError)
            return NextResponse.json(
                { error: `Database error: ${dbError.message}` },
                { status: 500 }
            )
        }

        logDebug('13. Executing Background Fetch to process-rfp', { rfpId: rfpDoc.id })
        try {
            const cookieHeader = request.headers.get('cookie') || ''
            
            const processResponse = await fetch(`${request.nextUrl.origin}/api/process-rfp`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cookie': cookieHeader
                },
                body: JSON.stringify({ rfp_id: rfpDoc.id, tenant_id: tenantId }),
            })
            
            logDebug('14. Fetch completed', { status: processResponse.status, ok: processResponse.ok })
            
            if (!processResponse.ok) {
                const raw = await processResponse.text()
                logDebug('15. Fetch failure body:', { raw })
                const errData = (() => { try { return JSON.parse(raw) } catch(e) { return { error: raw } } })()
                return NextResponse.json({
                    success: false,
                    error: `AI Error: ${errData.error || processResponse.statusText}`,
                    status: 500
                })
            }
        } catch (err) {
            logDebug('15. ERROR: Fetch threw a hard exception', { error: err instanceof Error ? err.message : String(err) })
            return NextResponse.json({
                success: false,
                error: `AI Execution crashed: ${err instanceof Error ? err.message : 'Unknown routing error'}`,
                status: 500
            })
        }

        logDebug('16. Request perfectly completed')
        return NextResponse.json({
            success: true,
            rfp_id: rfpDoc.id,
            status: 'completed',
            message: 'RFP uploaded and securely processed.',
        })
    } catch (error) {
        console.error('Upload RFP error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
