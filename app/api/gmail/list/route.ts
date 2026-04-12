import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if user has connected Gmail
        const { data: integration, error: dbErr } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'google')
            .single()

        if (!integration || (!integration.refresh_token && !integration.access_token)) {
            return NextResponse.json({ 
                connected: false, 
                emails: [],
                debug: { integration, dbErr } 
            })
        }

        // Initialize Google Client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )
        oauth2Client.setCredentials({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token
        })

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

        // Find last 15 emails with matching attachments
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'has:attachment (filename:pdf OR filename:docx OR filename:xlsx)',
            maxResults: 15
        })

        const messages = res.data.messages || []
        
        // Fetch details for each message
        const emails = await Promise.all(messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!
            })
            
            const payload = detail.data.payload
            const headers = payload?.headers || []
            
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
            const date = headers.find(h => h.name === 'Date')?.value || ''

            // Extract attachments from parts
            const attachments: any[] = []
            if (payload?.parts) {
                payload.parts.forEach(part => {
                    if (part.filename && part.body?.attachmentId) {
                        const extension = part.filename.split('.').pop()?.toLowerCase()
                        if (['pdf', 'docx', 'xlsx'].includes(extension || '')) {
                            attachments.push({
                                filename: part.filename,
                                mimeType: part.mimeType,
                                attachmentId: part.body.attachmentId,
                                size: part.body.size
                            })
                        }
                    }
                })
            }

            return {
                id: detail.data.id,
                subject,
                from,
                date,
                snippet: detail.data.snippet,
                attachments
            }
        }))

        // Filter out emails that didn't have valid attachments (in case of query false positives)
        const validEmails = emails.filter(e => e.attachments.length > 0)

        return NextResponse.json({ connected: true, email: integration.email, emails: validEmails })

    } catch (error: any) {
        // Handle invalid grant (token revoked etc)
        if (error.message?.includes('invalid_grant')) {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('user_integrations').delete().eq('user_id', user.id).eq('provider', 'google')
            }
            return NextResponse.json({ connected: false, error: 'Token expired or revoked. Please reconnect.' })
        }
        
        console.error('Error fetching gmail list:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch emails' }, { status: 500 })
    }
}
