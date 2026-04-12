import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
        ]

        const authorizationUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Force consent prompt to guarantee refresh token is returned
            scope: scopes,
            include_granted_scopes: true,
            state: user.id // Pass the user ID strictly so we know who corresponds to the callback
        })

        return NextResponse.redirect(authorizationUrl)
    } catch (error) {
        console.error('Error generating Google OAuth URL:', error)
        return NextResponse.redirect(new URL('/dashboard?error=auth_failed', request.url))
    }
}
