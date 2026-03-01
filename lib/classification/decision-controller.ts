/**
 * Email Classification — Decision Controller
 * Orchestrates the 3-stage classification pipeline.
 */

import { basicHeuristicCheck } from './heuristic'
import { generateWithAI } from '@/lib/ai/client'
import { validateAIResponse } from '@/lib/ai/validation'
import type { AIClassificationResponse } from '@/types/database'

interface ClassificationResult {
    is_rfp: boolean
    confidence: number
    intent_type: string
    method: string
    reason: string
}

interface EmailInput {
    subject: string
    body: string
    sender: string
    attachmentNames: string[]
}

/**
 * Classify an email through the 3-stage pipeline:
 * 1. Heuristic filter (fast, free)
 * 2. Lightweight scoring (keyword-based, no ML infra)
 * 3. AI fallback (Gemini, only for ambiguous cases)
 */
export async function classifyEmail(email: EmailInput): Promise<ClassificationResult> {
    // Stage 1: Heuristic
    const heuristic = basicHeuristicCheck(email)

    if (heuristic.confidence >= 60 && heuristic.is_rfp === 'likely') {
        return {
            is_rfp: true,
            confidence: heuristic.confidence,
            intent_type: 'rfp',
            method: 'heuristic',
            reason: `Heuristic detected: ${heuristic.indicators.slice(0, 3).join(', ')}`,
        }
    }

    if (heuristic.is_rfp === false && heuristic.confidence >= 80) {
        return {
            is_rfp: false,
            confidence: heuristic.confidence,
            intent_type: 'not_relevant',
            method: 'heuristic',
            reason: 'No RFP indicators found',
        }
    }

    // Stage 2: Lightweight keyword scoring (replaces ML for MVP)
    const keywordScore = advancedKeywordScore(email)

    if (keywordScore >= 0.75) {
        return {
            is_rfp: true,
            confidence: Math.round(keywordScore * 100),
            intent_type: 'rfp',
            method: 'keyword_scoring',
            reason: 'High keyword relevance score',
        }
    }

    if (keywordScore <= 0.30) {
        return {
            is_rfp: false,
            confidence: Math.round((1 - keywordScore) * 100),
            intent_type: 'not_relevant',
            method: 'keyword_scoring',
            reason: 'Low keyword relevance score',
        }
    }

    // Stage 3: AI fallback for ambiguous cases (10-20%)
    try {
        const aiResult = await classifyWithAI(email)
        return {
            is_rfp: aiResult.is_rfp,
            confidence: aiResult.confidence,
            intent_type: aiResult.intent_type,
            method: 'ai',
            reason: aiResult.reason,
        }
    } catch (error) {
        // Fallback: use heuristic result if AI fails
        return {
            is_rfp: heuristic.is_rfp === 'likely',
            confidence: heuristic.confidence,
            intent_type: heuristic.is_rfp === 'likely' ? 'rfp' : 'not_relevant',
            method: 'heuristic_fallback',
            reason: 'AI classification failed, using heuristic result',
        }
    }
}

/**
 * Advanced keyword scoring (Stage 2 replacement for ML).
 * Weighted feature analysis without requiring ML infrastructure.
 */
function advancedKeywordScore(email: EmailInput): number {
    let score = 0
    const text = `${email.subject} ${email.body}`.toLowerCase()

    // High-signal patterns
    const highSignal = [
        /request for (proposal|information|quote)/i,
        /invitation to (bid|tender)/i,
        /rfp\s*#?\d/i,
        /bid\s*(due|deadline|submission)/i,
        /scope of work/i,
        /evaluation criteria/i,
    ]
    score += highSignal.filter((p) => p.test(text)).length * 0.15

    // Medium-signal patterns
    const medSignal = [
        /deadline/i, /due date/i, /submission/i,
        /vendor/i, /contractor/i, /deliverables/i,
    ]
    score += medSignal.filter((p) => p.test(text)).length * 0.08

    // Attachment relevance
    const hasRelevantAttachment = email.attachmentNames.some((name) =>
        /\.(pdf|docx|xlsx)$/i.test(name)
    )
    if (hasRelevantAttachment) score += 0.1

    // Sender domain signals
    const govDomains = ['.gov', '.mil', '.edu']
    if (govDomains.some((d) => email.sender.toLowerCase().includes(d))) {
        score += 0.1
    }

    return Math.min(score, 1)
}

/**
 * AI classification (Stage 3 — Gemini fallback).
 */
async function classifyWithAI(email: EmailInput): Promise<AIClassificationResponse> {
    const prompt = `You are classifying procurement-related emails.
Determine if this email is requesting a formal RFP, RFI, or tender submission.

Email Subject: ${email.subject}
Email Sender: ${email.sender}
Email Body (snippet): ${email.body.slice(0, 500)}
Attachments: ${email.attachmentNames.join(', ') || 'None'}

Return strict JSON:
{
  "is_rfp": true/false,
  "confidence": number (0-100),
  "intent_type": "rfp" | "rfi" | "general_procurement" | "not_relevant",
  "reason": "short explanation"
}`

    const raw = await generateWithAI(prompt)
    return validateAIResponse<AIClassificationResponse>(raw, {
        is_rfp: 'boolean',
        confidence: 'number',
        intent_type: 'string',
        reason: 'string',
    })
}
