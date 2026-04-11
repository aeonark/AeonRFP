import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { email, password, fullName, company } = await request.json()

        if (!email || !password || !fullName || !company) {
            return NextResponse.json(
                { error: 'Missing required fields: email, password, fullName, company' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Step 1: Create the Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    company_name: company,
                }
            }
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'User creation failed. Please try again.' },
                { status: 500 }
            )
        }

        // Step 2: Create tenant using the service role (via admin client)
        // Use upsert to prevent duplicate key errors on retry
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                company_name: company,
                plan_type: 'starter',
            })
            .select()
            .single()

        if (tenantError) {
            console.error('[SIGNUP] Tenant creation failed:', tenantError)
            // Don't block signup if tenant creation fails — user can still log in
            // and we handle lazy tenant creation in upload-rfp
        }

        // Step 3: Create user profile row with UPSERT
        if (tenantData) {
            const { error: userError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    tenant_id: tenantData.id,
                    role: 'admin',
                }, { onConflict: 'id' })

            if (userError) {
                console.error('[SIGNUP] User profile creation failed:', userError)
                // Non-blocking — auth user exists, profile will be lazy-created
            }
        }

        // Step 4: Return result based on whether email confirmation is needed
        const needsConfirmation = !authData.session

        return NextResponse.json({
            success: true,
            needsConfirmation,
            userId: authData.user.id,
            message: needsConfirmation
                ? 'Account created! Check your email to verify your account.'
                : 'Account created successfully.',
        })
    } catch (err: any) {
        console.error('[SIGNUP] Unexpected error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
