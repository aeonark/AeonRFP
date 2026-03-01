/**
 * Email Classification — Heuristic Filter (Stage 1)
 * Fast keyword-based detection before ML/AI stages.
 */

interface HeuristicResult {
    is_rfp: boolean | 'likely'
    confidence: number
    method: 'heuristic'
    indicators: string[]
}

const SUBJECT_KEYWORDS = [
    'rfp', 'rfi', 'rfq', 'tender', 'proposal', 'bid', 'solicitation',
    'procurement', 'request for proposal', 'request for information',
    'request for quote', 'invitation to bid', 'competitive bid',
]

const BODY_KEYWORDS = [
    'deadline', 'due date', 'submission date', 'closing date',
    'scope of work', 'statement of work', 'sow', 'deliverables',
    'evaluation criteria', 'technical requirements', 'mandatory requirements',
    'proposal must', 'proposals shall', 'vendors are invited',
    'sealed bid', 'contract award', 'pricing schedule',
]

const ATTACHMENT_KEYWORDS = [
    'rfp', 'rfi', 'tender', 'proposal', 'solicitation', 'bid', 'sow',
]

/**
 * Stage 1 heuristic check for RFP classification.
 */
export function basicHeuristicCheck(email: {
    subject: string
    body: string
    attachmentNames: string[]
}): HeuristicResult {
    const indicators: string[] = []
    const subjectLower = email.subject.toLowerCase()
    const bodyLower = email.body.toLowerCase()

    // Check subject
    for (const keyword of SUBJECT_KEYWORDS) {
        if (subjectLower.includes(keyword)) {
            indicators.push(`Subject contains "${keyword}"`)
        }
    }

    // Check body
    let bodyHits = 0
    for (const keyword of BODY_KEYWORDS) {
        if (bodyLower.includes(keyword)) {
            bodyHits++
            if (bodyHits <= 3) indicators.push(`Body contains "${keyword}"`)
        }
    }

    // Check attachments
    for (const name of email.attachmentNames) {
        const nameLower = name.toLowerCase()
        for (const keyword of ATTACHMENT_KEYWORDS) {
            if (nameLower.includes(keyword)) {
                indicators.push(`Attachment "${name}" contains "${keyword}"`)
            }
        }
    }

    // Scoring
    const subjectScore = indicators.filter((i) => i.startsWith('Subject')).length > 0 ? 30 : 0
    const bodyScore = Math.min(bodyHits * 10, 30)
    const attachmentScore = indicators.filter((i) => i.startsWith('Attachment')).length > 0 ? 20 : 0
    const hasAttachment = email.attachmentNames.length > 0 ? 10 : 0

    const totalScore = subjectScore + bodyScore + attachmentScore + hasAttachment

    if (totalScore >= 50) {
        return { is_rfp: 'likely', confidence: Math.min(totalScore, 65), method: 'heuristic', indicators }
    }
    if (totalScore <= 10) {
        return { is_rfp: false, confidence: Math.max(100 - totalScore, 20), method: 'heuristic', indicators }
    }

    // Ambiguous — needs ML/AI stage
    return { is_rfp: 'likely', confidence: totalScore, method: 'heuristic', indicators }
}
