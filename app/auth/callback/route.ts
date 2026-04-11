import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error, data: authData } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && authData?.user) {
            const user = authData.user
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            const companyName = user.user_metadata?.company_name || `${fullName}'s Workspace`

            // Check if user already has a profile row
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, tenant_id')
                .eq('id', user.id)
                .single()

            if (!existingUser) {
                // First time — create tenant + user profile (e.g. Google OAuth or email confirmation)
                const { data: tenantData, error: tenantErr } = await supabase
                    .from('tenants')
                    .insert({
                        company_name: companyName,
                        plan_type: 'starter',
                    })
                    .select()
                    .single()

                if (!tenantErr && tenantData) {
                    // Upsert user row to avoid crashes on duplicate key
                    await supabase.from('users').upsert({
                        id: user.id,
                        email: user.email,
                        full_name: fullName,
                        tenant_id: tenantData.id,
                        role: 'admin',
                    }, { onConflict: 'id' })
                }
            }

            // Always redirect to dashboard on success
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Redirect to login with error if something went wrong
    return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+link`)
}
