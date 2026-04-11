import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { clause_id, generated_answer } = await request.json()

        if (!clause_id) {
            return NextResponse.json({ error: 'Missing clause_id' }, { status: 400 })
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('clauses')
            .update({ generated_answer: generated_answer || null })
            .eq('id', clause_id)

        if (error) {
            console.error('[save-clause] DB error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
