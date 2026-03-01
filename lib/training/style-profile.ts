/**
 * Organization Training — Style Profiling
 * Builds a lightweight style profile from training documents.
 */

interface StyleAnalysis {
    avg_sentence_length: number
    common_phrases: string[]
    formality_score: number
    tone_vector: Record<string, number>
}

/**
 * Analyze text corpus to build a style profile.
 */
export function analyzeStyle(texts: string[]): StyleAnalysis {
    const allText = texts.join(' ')
    const sentences = allText.match(/[^.!?]+[.!?]+/g) || []

    // Average sentence length
    const avgSentenceLength =
        sentences.length > 0
            ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
            : 15

    // Common phrases (2-3 word ngrams)
    const phrases = extractCommonPhrases(allText, 20)

    // Formality score heuristic
    const formality = calculateFormalityScore(allText)

    // Basic tone vector
    const tone = calculateToneVector(allText)

    return {
        avg_sentence_length: Math.round(avgSentenceLength * 100) / 100,
        common_phrases: phrases,
        formality_score: formality,
        tone_vector: tone,
    }
}

function extractCommonPhrases(text: string, topN: number): string[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    const bigramCounts = new Map<string, number>()

    for (let i = 0; i < words.length - 1; i++) {
        if (words[i].length > 2 && words[i + 1].length > 2) {
            const bigram = `${words[i]} ${words[i + 1]}`
            bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1)
        }
    }

    return Array.from(bigramCounts.entries())
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([phrase]) => phrase)
}

function calculateFormalityScore(text: string): number {
    const words = text.toLowerCase().split(/\s+/)
    const totalWords = words.length
    if (totalWords === 0) return 0.5

    // Formal indicators
    const formalWords = [
        'shall', 'hereby', 'pursuant', 'whereas', 'notwithstanding',
        'herein', 'thereof', 'hereunder', 'accordingly', 'furthermore',
        'moreover', 'consequently', 'therefore',
    ]

    // Informal indicators
    const informalWords = [
        'gonna', 'wanna', 'kinda', 'yeah', 'ok', 'cool', 'awesome',
        'basically', 'literally', 'stuff',
    ]

    const formalCount = words.filter((w) => formalWords.includes(w)).length
    const informalCount = words.filter((w) => informalWords.includes(w)).length

    // Passive voice indicator (rough heuristic)
    const passiveMatches = text.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/g) || []
    const passiveRatio = passiveMatches.length / Math.max(totalWords / 20, 1)

    const score = 0.5 + (formalCount / totalWords) * 10 - (informalCount / totalWords) * 10 + passiveRatio * 0.2
    return Math.min(Math.max(score, 0), 1)
}

function calculateToneVector(text: string): Record<string, number> {
    const words = text.toLowerCase().split(/\s+/)
    const total = words.length || 1

    const categories: Record<string, string[]> = {
        confident: ['proven', 'demonstrated', 'certified', 'guaranteed', 'established', 'proven'],
        cautious: ['may', 'might', 'could', 'potentially', 'approximately', 'estimated'],
        technical: ['system', 'architecture', 'infrastructure', 'implementation', 'configuration'],
        professional: ['ensure', 'maintain', 'provide', 'deliver', 'support', 'facilitate'],
    }

    const vector: Record<string, number> = {}
    for (const [category, keywords] of Object.entries(categories)) {
        const count = words.filter((w) => keywords.includes(w)).length
        vector[category] = Math.round((count / total) * 1000) / 1000
    }

    return vector
}
