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
      // Check if user already exists in our custom users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      // If user doesn't exist (e.g., first time logging in via Google OAuth), create tenant and user
      if (!existingUser) {
        // Extract name/company from Google metadata or use generic
        const fullName = authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User'
        
        // 1. Create a personal tenant for the new OAuth user
        const { data: tenantData } = await supabase.from('tenants').insert({
            company_name: `${fullName}'s Workspace`,
            plan_type: 'starter'
        }).select().single()

        if (tenantData) {
            // 2. Link the user to the newly created tenant
            await supabase.from('users').insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: fullName,
                tenant_id: tenantData.id,
                role: 'admin'
            })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with an error parameter if something went wrong
  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+link`)
}
