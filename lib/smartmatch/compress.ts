/**
 * SmartMatch — Context Compression
 * Trims and deduplicates matched content to stay within token budgets.
 */

import type { SmartMatchResult } from '@/types/database'

const MAX_TOKENS_PER_MATCH = 500
const MAX_TOTAL_TOKENS = 1200
const AVG_CHARS_PER_TOKEN = 4

/**
 * Compress matched results for prompt injection.
 * - Trims each match to max 500 tokens
 * - Removes redundant phrases
 * - Keeps total context under 1200 tokens
 */
export function compressContext(matches: SmartMatchResult[]): string[] {
    if (matches.length === 0) return []

    const maxCharsPerMatch = MAX_TOKENS_PER_MATCH * AVG_CHARS_PER_TOKEN
    const maxTotalChars = MAX_TOTAL_TOKENS * AVG_CHARS_PER_TOKEN

    let totalChars = 0
    const compressed: string[] = []

    for (const match of matches) {
        if (totalChars >= maxTotalChars) break

        let text = match.text.trim()

        // Remove redundant filler phrases
        text = removeFillerPhrases(text)

        // Trim to max chars per match
        if (text.length > maxCharsPerMatch) {
            text = trimToSentenceBoundary(text, maxCharsPerMatch)
        }

        // Check total budget
        const remainingBudget = maxTotalChars - totalChars
        if (text.length > remainingBudget) {
            text = trimToSentenceBoundary(text, remainingBudget)
        }

        if (text.length > 20) {
            compressed.push(text)
            totalChars += text.length
        }
    }

    return compressed
}

function removeFillerPhrases(text: string): string {
    const fillerPatterns = [
        /\b(as mentioned (above|below|earlier|previously))\b/gi,
        /\b(please (note|see|refer to))\b/gi,
        /\b(it (is|should be) (noted|mentioned) that)\b/gi,
        /\b(in (order|addition) to)\b/gi,
        /\b(for (the purpose|purposes) of)\b/gi,
        /\b(with (respect|regard) to)\b/gi,
        /\b(as (per|described in))\b/gi,
    ]

    let cleaned = text
    for (const pattern of fillerPatterns) {
        cleaned = cleaned.replace(pattern, '')
    }

    // Clean up double spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
    return cleaned
}

function trimToSentenceBoundary(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text

    const truncated = text.slice(0, maxLength)
    const lastEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
    )

    if (lastEnd > maxLength * 0.5) {
        return truncated.slice(0, lastEnd + 1)
    }

    return truncated.trimEnd()
}
