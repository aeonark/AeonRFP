import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { messageId, attachmentId, filename, mimeType } = await request.json()

        if (!messageId || !attachmentId) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Retrieve integration
        const { data: integration } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'google')
            .single()

        if (!integration || !integration.refresh_token) {
            return NextResponse.json({ error: 'Gmail not connected' }, { status: 403 })
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )
        oauth2Client.setCredentials({ refresh_token: integration.refresh_token })
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

        // 1. Fetch Attachment
        const response = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: attachmentId
        })

        const base64url = response.data.data
        if (!base64url) throw new Error('Failed to retrieve attachment data')
        
        // Gmail returns base64url format
        const buffer = Buffer.from(base64url.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

        // 2. Resolve Tenant
        let { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
        let tenantId = userData?.tenant_id

        if (!tenantId) {
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            const { data: newTenant } = await supabase.from('tenants').insert({ company_name: `${fullName}'s Workspace`, plan_type: 'starter' }).select().single()
            if (newTenant) {
                await supabase.from('users').insert({ id: user.id, email: user.email, full_name: fullName, tenant_id: newTenant.id, role: 'admin' })
                tenantId = newTenant.id
            }
        }
        if (!tenantId) throw new Error('Tenant resolution failed')

        // 3. Upload to Storage
        const fileExt = filename.split('.').pop()
        const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `${tenantId}/${Date.now()}-${cleanName}`

        const { error: uploadError } = await supabase.storage
            .from('rfp-documents')
            .upload(storagePath, buffer, {
                contentType: mimeType || 'application/octet-stream',
            })

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from('rfp-documents').getPublicUrl(storagePath)

        // 4. Insert Document Row
        const { data: rfpDoc, error: dbError } = await supabase
            .from('rfp_documents')
            .insert({
                tenant_id: tenantId,
                name: filename,
                file_url: urlData.publicUrl,
                status: 'uploaded',
            })
            .select()
            .single()

        if (dbError) throw new Error(`Database insert failed: ${dbError.message}`)

        // 5. Trigger Process RFP
        const cookieHeader = request.headers.get('cookie') || ''
        fetch(`${request.nextUrl.origin}/api/process-rfp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
            body: JSON.stringify({ rfp_id: rfpDoc.id, tenant_id: tenantId }),
        }).catch(err => console.error('Background process-rfp fetch failed:', err))

        return NextResponse.json({
            success: true,
            rfp_id: rfpDoc.id,
            status: 'completed',
            message: 'Attachment extracted and queued for processing.',
        })

    } catch (error: any) {
        console.error('Process attachment error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
