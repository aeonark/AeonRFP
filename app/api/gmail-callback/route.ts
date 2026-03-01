import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || ''

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code')
    const stateParam = request.nextUrl.searchParams.get('state')

    if (!code || !stateParam) {
        return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/gmail?error=missing_params`)
    }

    try {
        // Decode state
        const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
        const { tenant_id, user_id } = state

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        })

        if (!tokenRes.ok) throw new Error('Token exchange failed')
        const tokens = await tokenRes.json()

        // Get user email
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const userInfo = await userInfoRes.json()

        // Store connection (tokens encrypted in production via TOKEN_ENCRYPTION_KEY)
        const supabase = await createClient()
        await supabase.from('gmail_connections').upsert({
            tenant_id,
            user_id,
            google_email: userInfo.email,
            access_token_encrypted: tokens.access_token, // Encrypt in production
            refresh_token_encrypted: tokens.refresh_token, // Encrypt in production
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })

        // Initialize gmail settings
        await supabase.from('gmail_settings').upsert({
            tenant_id,
            auto_scan_enabled: false,
            scan_frequency_minutes: 30,
        })

        return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/gmail?connected=true`)
    } catch (error) {
        console.error('Gmail callback error:', error)
        return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/gmail?error=auth_failed`)
    }
}
