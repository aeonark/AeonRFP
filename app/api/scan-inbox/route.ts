import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyEmail } from '@/lib/classification/decision-controller'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { tenant_id, user_id } = await request.json()

        if (!tenant_id || !user_id) {
            return NextResponse.json({ error: 'Missing tenant_id or user_id' }, { status: 400 })
        }

        // Get Gmail connection
        const { data: connection } = await supabase
            .from('gmail_connections')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('user_id', user_id)
            .single()

        if (!connection) {
            return NextResponse.json({ error: 'Gmail not connected' }, { status: 404 })
        }

        // TODO: Refresh token if expired

        // Fetch recent emails
        const messagesRes = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20',
            { headers: { Authorization: `Bearer ${connection.access_token_encrypted}` } }
        )

        if (!messagesRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 502 })
        }

        const messagesData = await messagesRes.json()
        const messageIds = (messagesData.messages || []).map((m: { id: string }) => m.id)

        const results = []

        for (const messageId of messageIds.slice(0, 20)) {
            // Check for duplicate
            const { data: existing } = await supabase
                .from('email_logs')
                .select('id')
                .eq('tenant_id', tenant_id)
                .eq('gmail_message_id', messageId)
                .single()

            if (existing) continue

            // Fetch full message
            const msgRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
                { headers: { Authorization: `Bearer ${connection.access_token_encrypted}` } }
            )
            const msg = await msgRes.json()

            const headers = msg.payload?.headers || []
            const subject = headers.find((h: { name: string }) => h.name === 'Subject')?.value || ''
            const sender = headers.find((h: { name: string }) => h.name === 'From')?.value || ''
            const snippet = msg.snippet || ''

            // Get attachment names
            const attachments = (msg.payload?.parts || [])
                .filter((p: { filename: string }) => p.filename)
                .map((p: { filename: string }) => p.filename)

            // Classify
            const classification = await classifyEmail({
                subject,
                body: snippet,
                sender,
                attachmentNames: attachments,
            })

            // Store
            await supabase.from('email_logs').insert({
                tenant_id,
                gmail_message_id: messageId,
                subject,
                sender,
                snippet,
                received_at: new Date(parseInt(msg.internalDate)).toISOString(),
                classified_as_rfp: classification.is_rfp,
                classification_method: classification.method as 'heuristic' | 'ml' | 'ai',
                classification_confidence: classification.confidence,
                intent_type: classification.intent_type as 'rfp' | 'rfi' | 'general_procurement' | 'not_relevant',
                processed: false,
            })

            results.push({
                message_id: messageId,
                subject,
                is_rfp: classification.is_rfp,
                confidence: classification.confidence,
                method: classification.method,
            })
        }

        return NextResponse.json({
            success: true,
            scanned: results.length,
            rfps_detected: results.filter((r) => r.is_rfp).length,
            results,
        })
    } catch (error) {
        console.error('Scan inbox error:', error)
        return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
    }
}
