/**
 * AI Client — Gemini API Integration
 * Handles text generation with retry logic and token guards.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const MODEL = 'gemini-2.0-flash'
const MAX_OUTPUT_TOKENS = 1024
const MAX_RETRIES = 2

/**
 * Generate text using Gemini API.
 * Returns raw response text.
 */
export async function generateWithAI(prompt: string): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: MAX_OUTPUT_TOKENS,
                            temperature: 0.3,
                            topP: 0.8,
                            responseMimeType: 'application/json',
                        },
                    }),
                }
            )

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text

            if (!text) {
                throw new Error('Empty response from Gemini API')
            }

            return text
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            if (attempt < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
            }
        }
    }

    throw lastError || new Error('AI generation failed after retries')
}

/**
 * Estimate token usage for a given text.
 * Rough estimate: ~4 characters per token.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
}
