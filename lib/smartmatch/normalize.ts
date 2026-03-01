/**
 * SmartMatch — Clause Normalization
 * Cleans and normalizes clause text for consistent processing.
 */

const MAX_LENGTH = 1500

/**
 * Normalize clause text for embedding and matching.
 * - Removes excessive whitespace
 * - Removes numbering prefixes (e.g., "1.2.3")
 * - Removes special characters that don't carry meaning
 * - Limits max length
 * - Preserves semantic meaning
 */
export function normalizeClause(clause: string): string {
    let normalized = clause

    // Remove numbering prefixes (e.g., "1.0", "2.1.3", "a)", "iv.")
    normalized = normalized.replace(/^\s*(?:\d+\.)+\d*\s*/gm, '')
    normalized = normalized.replace(/^\s*[a-z]\)\s*/gm, '')
    normalized = normalized.replace(/^\s*(?:i{1,3}|iv|vi{0,3}|ix|x)[\.)]\s*/gim, '')

    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ')

    // Remove special characters that don't add semantic value
    normalized = normalized.replace(/[^\w\s.,;:!?'"()\-\/&%$#@+={}\[\]]/g, '')

    // Trim
    normalized = normalized.trim()

    // Enforce max length
    if (normalized.length > MAX_LENGTH) {
        // Try to cut at a sentence boundary
        const truncated = normalized.slice(0, MAX_LENGTH)
        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('?'),
            truncated.lastIndexOf('!')
        )
        if (lastSentenceEnd > MAX_LENGTH * 0.7) {
            normalized = truncated.slice(0, lastSentenceEnd + 1)
        } else {
            normalized = truncated
        }
    }

    return normalized
}
