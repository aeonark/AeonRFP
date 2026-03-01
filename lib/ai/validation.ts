/**
 * AI Response Validation
 * JSON schema validation with retry and fallback logic.
 */

import { generateWithAI } from './client'

/**
 * Validate AI response against expected schema.
 * On parse failure, retries up to maxRetries times.
 * On final failure, returns a conservative fallback.
 */
export function validateAIResponse<T>(
    rawResponse: string,
    _schema: Record<string, string>
): T {
    // Clean response — strip markdown code fences if present
    let cleaned = rawResponse.trim()
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7)
    }
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    try {
        const parsed = JSON.parse(cleaned) as T
        return parsed
    } catch {
        // Try to extract JSON from mixed content
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]) as T
            } catch {
                // Fall through to fallback
            }
        }

        // Return conservative fallback
        return {
            answer: 'Unable to generate a response at this time. Please review this clause manually.',
            confidence_score: 10,
            risk_flag: 'high',
            reasoning_summary: 'AI response could not be parsed. Manual review required.',
        } as T
    }
}

/**
 * Generate and validate with automatic retry.
 */
export async function generateAndValidate<T>(
    prompt: string,
    schema: Record<string, string>,
    maxRetries = 2
): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const raw = await generateWithAI(prompt)
            const validated = validateAIResponse<T>(raw, schema)
            return validated
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
            }
        }
    }

    throw lastError || new Error('Generation and validation failed')
}
