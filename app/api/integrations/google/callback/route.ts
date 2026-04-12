import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state') // This is the user ID we passed in

        if (!code || !state) {
            return NextResponse.redirect(new URL('/dashboard/upload?error=missing_code', request.url))
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )

        // Exchange authorization code for access & refresh tokens
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Fetch their email so we can display which account they connected
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
        const userInfo = await oauth2.userinfo.get()
        const email = userInfo.data.email

        const supabase = await createClient()

        // Upsert into our user_integrations table
        const { error } = await supabase
            .from('user_integrations')
            .upsert({
                user_id: state,
                provider: 'google',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token, // Critical for long-lived offline access
                expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                email: email,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,provider' })

        if (error) {
            console.error('Failed to save integration to DB:', error)
            return NextResponse.redirect(new URL('/dashboard/upload?error=db_save_failed', request.url))
        }

        // Successfully connected
        return NextResponse.redirect(new URL('/dashboard/upload?tab=gmail', request.url))
        
    } catch (error) {
        console.error('Error during Google OAuth callback:', error)
        return NextResponse.redirect(new URL('/dashboard/upload?error=oauth_failed', request.url))
    }
}
