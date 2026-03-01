/**
 * Usage Tracker
 * Logs token usage, latency, and costs per tenant for monitoring.
 */

interface UsageRecord {
    tenant_id: string
    user_id?: string
    action_type: string
    tokens_used: number
    latency_ms: number
    metadata?: Record<string, unknown>
}

/**
 * Track usage metrics. In production, writes to usage_metrics table.
 */
export async function trackUsage(record: UsageRecord): Promise<void> {
    const costEstimate = estimateApiCost(record.tokens_used)

    // In production, write to Supabase:
    // const supabase = await createClient()
    // await supabase.from('usage_metrics').insert({
    //   ...record,
    //   cost_estimate: costEstimate,
    // })

    // Console log for MVP
    console.log(`[USAGE] tenant=${record.tenant_id} action=${record.action_type} tokens=${record.tokens_used} cost=$${costEstimate.toFixed(6)} latency=${record.latency_ms}ms`)
}

/**
 * Get usage summary for a tenant in current billing cycle.
 */
export async function getTenantUsageSummary(tenantId: string): Promise<{
    total_tokens: number
    total_cost: number
    request_count: number
    avg_latency: number
}> {
    // In production, query from DB:
    // const { data } = await supabase
    //   .from('usage_metrics')
    //   .select('tokens_used, cost_estimate, latency_ms')
    //   .eq('tenant_id', tenantId)
    //   .gte('created_at', billingCycleStart)

    // Placeholder
    return {
        total_tokens: 0,
        total_cost: 0,
        request_count: 0,
        avg_latency: 0,
    }
}

function estimateApiCost(tokens: number): number {
    // Approximate Gemini Flash pricing
    return (tokens / 1000) * 0.000075
}

/**
 * Check if tenant has exceeded monthly cost threshold.
 */
export async function checkCostThreshold(
    tenantId: string,
    thresholdUsd = 50
): Promise<{ exceeded: boolean; currentCost: number }> {
    const summary = await getTenantUsageSummary(tenantId)
    return {
        exceeded: summary.total_cost >= thresholdUsd,
        currentCost: summary.total_cost,
    }
}
