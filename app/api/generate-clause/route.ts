import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeClause } from '@/lib/smartmatch/normalize'
import { generateEmbedding } from '@/lib/smartmatch/embedding'
import { searchKnowledgeBase } from '@/lib/smartmatch/search'
import { rerankResults } from '@/lib/smartmatch/rerank'
import { compressContext } from '@/lib/smartmatch/compress'
import { calculateConfidence } from '@/lib/smartmatch/confidence'
import { buildPrompt } from '@/lib/ai/prompt-builder'
import { generateWithAI } from '@/lib/ai/client'
import { validateAIResponse } from '@/lib/ai/validation'
import { enforcePlanLimits } from '@/lib/plans/enforcement'
import { trackUsage } from '@/lib/cost/usage-tracker'
import type { AIClauseResponse } from '@/types/database'

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder()
    const startTime = Date.now()

    try {
        const { clause_text, tenant_id, clause_id, company_name } = await request.json()

        if (!clause_text || !tenant_id) {
            return new Response(
                JSON.stringify({ error: 'Missing clause_text or tenant_id' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Enforce plan limits
        const limitCheck = await enforcePlanLimits(tenant_id, 'process_clause')
        if (!limitCheck.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Plan limit exceeded',
                    upgrade_required: true,
                    reason: limitCheck.reason,
                    recommended_plan: 'growth',
                }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Create SSE stream
        const stream = new ReadableStream({
            async start(controller) {
                function sendEvent(data: Record<string, unknown>) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                    )
                }

                try {
                    // Step 1: Normalize clause
                    sendEvent({ stage: 'normalizing', progress: 10 })
                    const normalized = normalizeClause(clause_text)

                    // Step 2: Generate embedding
                    sendEvent({ stage: 'embedding', progress: 20 })
                    const embedding = await generateEmbedding(normalized)

                    // Step 3: Search knowledge base
                    sendEvent({ stage: 'searching', progress: 40 })
                    const searchResults = await searchKnowledgeBase(embedding, tenant_id)

                    // Step 4: Re-rank results
                    sendEvent({ stage: 'ranking', progress: 50 })
                    const ranked = rerankResults(searchResults, normalized)

                    // Step 5: Compress context
                    sendEvent({ stage: 'compressing', progress: 60 })
                    const compressed = compressContext(ranked)

                    // Step 6: Calculate confidence
                    const confidence = calculateConfidence(ranked)

                    // Step 7: Build prompt and generate
                    sendEvent({ stage: 'generating', progress: 70 })
                    const prompt = buildPrompt({
                        clause_text: normalized,
                        compressed_examples: compressed,
                        company_name: company_name || 'Our Organization',
                    })

                    const rawResponse = await generateWithAI(prompt)

                    // Step 8: Validate response
                    sendEvent({ stage: 'validating', progress: 90 })
                    const validated = validateAIResponse<AIClauseResponse>(rawResponse, {
                        answer: 'string',
                        confidence_score: 'number',
                        risk_flag: 'string',
                        reasoning_summary: 'string',
                    })

                    // Override confidence with calculated value
                    validated.confidence_score = confidence

                    // Step 9: Save to DB
                    if (clause_id) {
                        const supabase = await createClient()
                        await supabase
                            .from('clauses')
                            .update({
                                generated_answer: validated.answer,
                                confidence_score: validated.confidence_score,
                                risk_flag: validated.risk_flag,
                                reasoning_summary: validated.reasoning_summary,
                            })
                            .eq('id', clause_id)
                            .eq('tenant_id', tenant_id)
                    }

                    // Track usage
                    const latencyMs = Date.now() - startTime
                    await trackUsage({
                        tenant_id,
                        action_type: 'generate_clause',
                        tokens_used: rawResponse.length / 4, // rough estimate
                        latency_ms: latencyMs,
                    })

                    // Send final result
                    sendEvent({
                        stage: 'complete',
                        progress: 100,
                        result: validated,
                    })
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Generation failed'
                    sendEvent({ stage: 'error', error: message })
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Generate clause error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
