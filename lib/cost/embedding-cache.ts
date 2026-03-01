/**
 * Embedding Cache
 * Hash-based deduplication to avoid redundant API calls.
 */

const CACHE = new Map<string, number[]>()

/**
 * Generate a hash for text content.
 */
async function hashText(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text.toLowerCase().trim())

    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    }

    // Fallback: simple hash for environments without crypto.subtle
    let hash = 0
    const str = text.toLowerCase().trim()
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return Math.abs(hash).toString(36)
}

/**
 * Get cached embedding for text.
 * Checks in-memory cache first, then DB.
 */
export async function getCachedEmbedding(text: string): Promise<number[] | null> {
    const hash = await hashText(text)

    // Check in-memory cache
    if (CACHE.has(hash)) {
        return CACHE.get(hash)!
    }

    // In production, also check embeddings_cache table:
    // const { data } = await supabase
    //   .from('embeddings_cache')
    //   .select('vector')
    //   .eq('text_hash', hash)
    //   .single()
    // if (data) return data.vector

    return null
}

/**
 * Cache an embedding.
 */
export async function setCachedEmbedding(
    text: string,
    vector: number[]
): Promise<void> {
    const hash = await hashText(text)

    // In-memory cache
    CACHE.set(hash, vector)

    // In production, also store in DB:
    // await supabase.from('embeddings_cache').upsert({
    //   text_hash: hash,
    //   vector,
    // })
}

/**
 * Clear the in-memory cache.
 */
export function clearEmbeddingCache(): void {
    CACHE.clear()
}
