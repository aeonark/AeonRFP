/**
 * SmartMatch — Confidence Calculation
 * Computes confidence score based on match quality and quantity.
 */

import type { SmartMatchResult } from '@/types/database'

const MAX_CONFIDENCE = 95
const HIGH_SIMILARITY_THRESHOLD = 0.8
const MATCH_BONUS_THRESHOLD = 3

/**
 * Calculate confidence score (0-95) based on match results.
 *
 * Base = average similarity_score * 100
 * Adjustments:
 *   +5 if 3+ high matches found
 *   -10 if no matches found
 *   Cap at 95
 */
export function calculateConfidence(matches: SmartMatchResult[]): number {
    if (matches.length === 0) return 15 // Low baseline when no matches

    // Base score from average similarity
    const avgSimilarity =
        matches.reduce((sum, m) => sum + m.similarity_score, 0) / matches.length
    let confidence = avgSimilarity * 100

    // Bonus for having multiple high-quality matches
    const highMatches = matches.filter(
        (m) => m.similarity_score >= HIGH_SIMILARITY_THRESHOLD
    ).length
    if (highMatches >= MATCH_BONUS_THRESHOLD) {
        confidence += 5
    }

    // Penalty for very few matches
    if (matches.length === 1 && matches[0].similarity_score < 0.75) {
        confidence -= 10
    }

    // Bonus for user-approved content
    const hasApproved = matches.some(
        (m) => m.metadata.is_user_approved === true
    )
    if (hasApproved) {
        confidence += 3
    }

    // Cap
    confidence = Math.min(confidence, MAX_CONFIDENCE)
    confidence = Math.max(confidence, 10)

    return Math.round(confidence)
}
