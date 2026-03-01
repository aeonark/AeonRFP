/**
 * SmartMatch — Re-ranking
 * Secondary scoring using keyword overlap, recency, and reuse count.
 */

import type { VectorSearchResult, SmartMatchResult } from '@/types/database'

/**
 * Re-rank search results with weighted multi-signal scoring.
 * Takes top 3 after re-ranking.
 */
export function rerankResults(
    results: VectorSearchResult[],
    queryText: string
): SmartMatchResult[] {
    if (results.length === 0) return []

    const queryKeywords = extractKeywords(queryText)

    const scored: SmartMatchResult[] = results.map((result) => {
        const keywordOverlap = calculateKeywordOverlap(queryKeywords, result.text)
        const recencyWeight = calculateRecencyWeight(result.metadata.created_at as string)
        const reuseCount = normalizeReuseCount(
            (result.metadata.reuse_count as number) || 0
        )

        const finalScore =
            0.6 * result.similarity_score +
            0.2 * keywordOverlap +
            0.1 * recencyWeight +
            0.1 * reuseCount

        return {
            text: result.text,
            similarity_score: result.similarity_score,
            keyword_overlap_score: keywordOverlap,
            recency_weight: recencyWeight,
            reuse_count: (result.metadata.reuse_count as number) || 0,
            final_score: Math.round(finalScore * 1000) / 1000,
            metadata: result.metadata,
        }
    })

    // Sort by final score descending, take top 3
    return scored
        .sort((a, b) => b.final_score - a.final_score)
        .slice(0, 3)
}

function extractKeywords(text: string): Set<string> {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
        'these', 'those', 'it', 'its', 'not', 'no', 'as', 'if', 'then',
    ])

    return new Set(
        text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 2 && !stopWords.has(w))
    )
}

function calculateKeywordOverlap(queryKeywords: Set<string>, text: string): number {
    if (queryKeywords.size === 0) return 0

    const textKeywords = extractKeywords(text)
    let overlap = 0

    for (const keyword of queryKeywords) {
        if (textKeywords.has(keyword)) overlap++
    }

    return Math.min(overlap / queryKeywords.size, 1)
}

function calculateRecencyWeight(createdAt: string | undefined): number {
    if (!createdAt) return 0.5

    const now = Date.now()
    const created = new Date(createdAt).getTime()
    const daysSince = (now - created) / (1000 * 60 * 60 * 24)

    // More recent = higher weight, decays over 365 days
    if (daysSince <= 30) return 1
    if (daysSince <= 90) return 0.8
    if (daysSince <= 180) return 0.6
    if (daysSince <= 365) return 0.4
    return 0.2
}

function normalizeReuseCount(count: number): number {
    // Normalize reuse count to 0-1 scale (sigmoid-like)
    return count / (count + 5)
}
