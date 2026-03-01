/**
 * SmartMatch — Vector Search
 * Queries Qdrant for similar knowledge chunks within a tenant namespace.
 */

import type { VectorSearchResult } from '@/types/database'

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || ''
const COLLECTION_NAME = 'aeonrfp_knowledge'
const TOP_K = 5
const SIMILARITY_THRESHOLD = 0.65

/**
 * Search the knowledge base for similar content within a tenant namespace.
 */
export async function searchKnowledgeBase(
    embedding: number[],
    tenantId: string
): Promise<VectorSearchResult[]> {
    try {
        const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}),
            },
            body: JSON.stringify({
                vector: embedding,
                limit: TOP_K,
                filter: {
                    must: [
                        {
                            key: 'tenant_id',
                            match: { value: tenantId },
                        },
                    ],
                },
                with_payload: true,
                score_threshold: SIMILARITY_THRESHOLD,
            }),
        })

        if (!response.ok) {
            console.error('Qdrant search failed:', response.statusText)
            return []
        }

        const data = await response.json()
        const results: VectorSearchResult[] = (data.result || []).map(
            (point: { score: number; payload: Record<string, unknown> }) => ({
                text: (point.payload.text as string) || '',
                similarity_score: point.score,
                metadata: {
                    document_type: point.payload.document_type,
                    created_at: point.payload.created_at,
                    chunk_id: point.payload.chunk_id,
                    reuse_count: point.payload.reuse_count || 0,
                },
            })
        )

        return results
    } catch (error) {
        console.error('Vector search error:', error)
        return []
    }
}

/**
 * Store an embedding in Qdrant for a tenant namespace.
 */
export async function storeEmbedding(
    id: string,
    embedding: number[],
    tenantId: string,
    payload: Record<string, unknown>
): Promise<void> {
    try {
        await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}),
            },
            body: JSON.stringify({
                points: [
                    {
                        id,
                        vector: embedding,
                        payload: {
                            tenant_id: tenantId,
                            ...payload,
                        },
                    },
                ],
            }),
        })
    } catch (error) {
        console.error('Store embedding error:', error)
    }
}
