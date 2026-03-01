/**
 * Token Manager
 * Estimates token usage and enforces hard caps.
 */

const MAX_INPUT_TOKENS = 4000
const MAX_OUTPUT_TOKENS = 1024
const AVG_CHARS_PER_TOKEN = 4

/**
 * Estimate token count for text.
 */
export function estimateTokenUsage(text: string): number {
    return Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
}

/**
 * Check if a request would exceed token limits.
 * Returns { allowed: boolean; estimated: number; limit: number }
 */
export function checkTokenBudget(
    clauseText: string,
    contextTexts: string[]
): { allowed: boolean; estimated: number; limit: number; breakdown: Record<string, number> } {
    const clauseTokens = estimateTokenUsage(clauseText)
    const contextTokens = contextTexts.reduce(
        (sum, t) => sum + estimateTokenUsage(t),
        0
    )
    const systemPromptTokens = 500 // approximate system prompt overhead
    const totalEstimated = clauseTokens + contextTokens + systemPromptTokens + MAX_OUTPUT_TOKENS

    return {
        allowed: totalEstimated <= MAX_INPUT_TOKENS + MAX_OUTPUT_TOKENS,
        estimated: totalEstimated,
        limit: MAX_INPUT_TOKENS + MAX_OUTPUT_TOKENS,
        breakdown: {
            clause: clauseTokens,
            context: contextTokens,
            system: systemPromptTokens,
            output_budget: MAX_OUTPUT_TOKENS,
        },
    }
}

/**
 * Enforce clause length limit (1500 characters).
 */
export function enforceClauseLength(text: string, maxChars = 1500): string {
    if (text.length <= maxChars) return text
    return text.slice(0, maxChars)
}

/**
 * Estimate cost for a request (rough estimate based on token pricing).
 * Uses approximate Gemini Flash pricing.
 */
export function estimateRequestCost(inputTokens: number, outputTokens: number): number {
    const INPUT_COST_PER_1K = 0.000075 // $0.075 per 1M input tokens
    const OUTPUT_COST_PER_1K = 0.0003   // $0.30 per 1M output tokens
    return (inputTokens / 1000) * INPUT_COST_PER_1K + (outputTokens / 1000) * OUTPUT_COST_PER_1K
}
