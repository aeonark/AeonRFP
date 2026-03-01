import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail-callback'

export async function GET(request: NextRequest) {
    const tenantId = request.nextUrl.searchParams.get('tenant_id')
    const userId = request.nextUrl.searchParams.get('user_id')

    if (!tenantId || !userId) {
        return NextResponse.json({ error: 'Missing tenant_id or user_id' }, { status: 400 })
    }

    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
    ].join(' ')

    const state = JSON.stringify({ tenant_id: tenantId, user_id: userId })
    const encodedState = Buffer.from(state).toString('base64url')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', encodedState)

    return NextResponse.redirect(authUrl.toString())
}
