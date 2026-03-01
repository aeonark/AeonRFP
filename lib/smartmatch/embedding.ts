/**
 * SmartMatch — Embedding Generation
 * Uses Gemini API for text embeddings with caching.
 */

import { getCachedEmbedding, setCachedEmbedding } from '@/lib/cost/embedding-cache'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const EMBEDDING_MODEL = 'text-embedding-004'

/**
 * Generate embedding vector for text.
 * Checks cache first, falls back to API call.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    // Check cache
    const cached = await getCachedEmbedding(text)
    if (cached) return cached

    // Call Gemini Embedding API
    const response = await fetchEmbeddingWithRetry(text)

    // Cache result
    await setCachedEmbedding(text, response)

    return response
}

async function fetchEmbeddingWithRetry(
    text: string,
    maxRetries = 2
): Promise<number[]> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: `models/${EMBEDDING_MODEL}`,
                        content: { parts: [{ text }] },
                    }),
                }
            )

            if (!res.ok) {
                throw new Error(`Embedding API error: ${res.status} ${res.statusText}`)
            }

            const data = await res.json()
            return data.embedding.values as number[]
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
            }
        }
    }

    throw lastError || new Error('Embedding generation failed')
}
