/**
 * Clause Type Classifier
 * 
 * Keyword-based classification of RFP clauses into categories.
 * No AI required — uses weighted keyword dictionaries.
 */

export type ClauseType = 'technical' | 'compliance' | 'financial' | 'operational' | 'legal' | 'general'

// ============================================
// Keyword Dictionaries
// ============================================

const KEYWORDS: Record<ClauseType, string[]> = {
    compliance: [
        'comply', 'compliance', 'nist', 'hipaa', 'fedramp', 'fisma', 'sox',
        'gdpr', 'pci', 'dss', 'cui', 'clearance', 'certification', 'certify',
        'authorized', 'authorization', 'audit', 'regulatory', 'regulation',
        'standard', 'accreditation', 'policy', 'security requirement',
        'background check', 'vetting', 'fips', 'itar', 'cmmc', 'iso 27001',
        'soc 2', 'attestation', 'controlled unclassified', 'classified',
    ],
    technical: [
        'system', 'software', 'hardware', 'architecture', 'api', 'integration',
        'database', 'server', 'cloud', 'infrastructure', 'network', 'platform',
        'application', 'deployment', 'scalability', 'performance', 'uptime',
        'availability', 'latency', 'bandwidth', 'encryption', 'protocol',
        'algorithm', 'interface', 'endpoint', 'microservice', 'container',
        'kubernetes', 'docker', 'ci/cd', 'devops', 'monitoring', 'sla',
        'disaster recovery', 'backup', 'redundancy', 'failover', 'real-time',
        'data migration', 'interoperability', 'fhir', 'hl7', 'rest',
    ],
    financial: [
        'cost', 'price', 'pricing', 'budget', 'fee', 'payment', 'invoice',
        'billing', 'tco', 'total cost', 'license', 'licensing', 'subscription',
        'discount', 'savings', 'roi', 'expenditure', 'funding', 'fiscal',
        'financial', 'quote', 'estimate', 'proposal cost', 'rate',
        'per-unit', 'volume discount', 'contract value', 'ceiling price',
    ],
    operational: [
        'staffing', 'personnel', 'training', 'support', 'maintenance',
        'help desk', 'service desk', 'response time', 'escalation',
        'transition', 'knowledge transfer', 'onboarding', 'offboarding',
        'project management', 'milestones', 'deliverables', 'schedule',
        'timeline', 'phased', 'implementation plan', 'rollout', 'workflow',
        'process', 'procedure', 'reporting', 'status report', 'meetings',
        'communication plan', 'governance', 'oversight', 'quality assurance',
    ],
    legal: [
        'indemnify', 'indemnification', 'liability', 'warranty', 'warrant',
        'guarantee', 'intellectual property', 'patent', 'copyright',
        'trademark', 'trade secret', 'confidential', 'nda',
        'non-disclosure', 'termination', 'breach', 'dispute', 'arbitration',
        'jurisdiction', 'governing law', 'limitation of liability',
        'force majeure', 'assignment', 'subcontract', 'insurance',
        'bond', 'damages', 'remedy', 'clause', 'provision', 'obligation',
    ],
    general: [],
}

// ============================================
// Classifier
// ============================================

/**
 * Classify a clause into a type based on keyword matching.
 * Returns the best-matching type with a confidence heuristic.
 */
export function classifyClause(text: string): { type: ClauseType; confidence: number } {
    const lower = text.toLowerCase()
    const scores: Record<ClauseType, number> = {
        technical: 0,
        compliance: 0,
        financial: 0,
        operational: 0,
        legal: 0,
        general: 0,
    }

    for (const [type, keywords] of Object.entries(KEYWORDS) as [ClauseType, string[]][]) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                // Give more weight to multi-word keywords (more specific)
                const weight = keyword.includes(' ') ? 2 : 1
                scores[type] += weight
            }
        }
    }

    // Find the highest scoring type
    let bestType: ClauseType = 'general'
    let bestScore = 0

    for (const [type, score] of Object.entries(scores) as [ClauseType, number][]) {
        if (score > bestScore) {
            bestScore = score
            bestType = type
        }
    }

    // Calculate confidence as a rough percentage
    // More keyword matches = higher confidence, capped at 95%
    const confidence = bestScore === 0
        ? 50  // Default confidence for "general" classification
        : Math.min(95, 55 + bestScore * 7)

    return { type: bestType, confidence }
}

/**
 * Assign a risk flag based on clause type and keyword analysis.
 */
export function assessRisk(text: string, clauseType: ClauseType): 'low' | 'medium' | 'high' {
    const lower = text.toLowerCase()

    // High risk indicators
    const highRiskKeywords = [
        'indemnif', 'unlimited liability', 'penalty', 'liquidated damages',
        'sole source', 'exclusive', 'guarantee', 'warrant',
    ]
    if (highRiskKeywords.some((k) => lower.includes(k))) return 'high'

    // Medium risk indicators
    const mediumRiskKeywords = [
        'shall', 'must', 'required', 'mandatory', 'deadline',
        'within', 'not exceed', 'no later than', 'failure to',
    ]
    const mediumCount = mediumRiskKeywords.filter((k) => lower.includes(k)).length
    if (mediumCount >= 3) return 'medium'

    // Legal and financial clauses default to medium
    if (clauseType === 'legal' || clauseType === 'financial') return 'medium'

    return 'low'
}
