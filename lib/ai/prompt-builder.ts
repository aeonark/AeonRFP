/**
 * AI Prompt Builder — 4-Layer Structured Prompt System
 * Generates enterprise-grade RFP responses with strict JSON output.
 */

interface PromptInput {
    clause_text: string
    compressed_examples: string[]
    company_name: string
    style_profile?: {
        avg_sentence_length?: number
        common_phrases?: string[]
        formality_score?: number
    }
}

/**
 * Build a structured multi-layer prompt for clause response generation.
 */
export function buildPrompt(input: PromptInput): string {
    const { clause_text, compressed_examples, company_name, style_profile } = input

    // Layer 1 — System Authority
    const systemLayer = `You are an enterprise RFP response specialist working for ${company_name}.
You prioritize accuracy over creativity.
If insufficient information exists, state limitations clearly.
Never fabricate certifications, legal claims, or statistics.
Do not copy historical examples verbatim.
Maintain professional business tone throughout.`

    // Layer 2 — Behavioral Constraints
    const behavioralLayer = `STRICT RULES:
1. If clause requires compliance claims, be specific but not legally absolute.
2. If information is missing, respond conservatively.
3. Do not invent policies, certifications, or capabilities.
4. Keep answer under 300 words.
5. No marketing fluff or buzzwords.
6. No emojis or casual language.
7. No excessive bullet points unless structurally necessary.
8. Write in complete, professional sentences.`

    // Layer 3 — Company Conditioning
    let companyLayer = `Company: ${company_name}\n`

    if (compressed_examples.length > 0) {
        companyLayer += `\nHistorical Writing Examples (use as stylistic guidance only, do NOT replicate sentences):\n`
        compressed_examples.forEach((example, i) => {
            companyLayer += `\nExample ${i + 1}:\n${example}\n`
        })
        companyLayer += `\nPreserve the tone and structure of these examples without copying them.`
    } else {
        companyLayer += `\nNo historical examples available. Generate a professional response based on standard enterprise practices.`
    }

    if (style_profile) {
        companyLayer += `\n\nCompany style characteristics:`
        if (style_profile.avg_sentence_length) {
            companyLayer += `\n- Average sentence length: ${Math.round(style_profile.avg_sentence_length)} words`
        }
        if (style_profile.common_phrases && style_profile.common_phrases.length > 0) {
            companyLayer += `\n- Common phrases: ${style_profile.common_phrases.slice(0, 5).join(', ')}`
        }
        if (style_profile.formality_score) {
            const tone = style_profile.formality_score > 0.7 ? 'formal' : style_profile.formality_score > 0.4 ? 'professional' : 'concise'
            companyLayer += `\n- Tone: ${tone}`
        }
    }

    // Layer 4 — Task Execution
    const taskLayer = `NEW RFP CLAUSE TO RESPOND TO:
"${clause_text}"

TASK: Generate a clear, structured response that directly answers this clause.

RISK ASSESSMENT:
- "low": Standard request with clear historical precedent
- "medium": Requires some inference or partial information
- "high": Financial, legal, or compliance-sensitive with limited data

Return ONLY valid JSON in this exact format:
{
  "answer": "your response text here",
  "confidence_score": number between 0 and 100,
  "risk_flag": "low" | "medium" | "high",
  "reasoning_summary": "max 2 sentences explaining your confidence level"
}`

    return `${systemLayer}\n\n${behavioralLayer}\n\n${companyLayer}\n\n${taskLayer}`
}
