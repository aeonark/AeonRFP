// ============================================
// AeonRFP Database Types
// ============================================

export type PlanType = 'starter' | 'growth'
export type UserRole = 'admin' | 'member' | 'viewer'
export type RfpStatus = 'uploaded' | 'processing' | 'completed' | 'failed'
export type ClauseType = 'technical' | 'compliance' | 'financial' | 'operational' | 'legal' | 'general'
export type RiskFlag = 'low' | 'medium' | 'high'
export type DocumentType = 'rfp_response' | 'policy' | 'capability'
export type ClassificationMethod = 'heuristic' | 'ml' | 'ai'
export type IntentType = 'rfp' | 'rfi' | 'general_procurement' | 'not_relevant'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================
// Core Entities
// ============================================

export interface Tenant {
    id: string
    company_name: string
    plan_type: PlanType
    usage_rfps_this_month: number
    vault_storage_used_mb: number
    last_billing_cycle_start: string
    created_at: string
}

export interface User {
    id: string
    email: string
    full_name: string | null
    tenant_id: string
    role: UserRole
    created_at: string
}

export interface RfpDocument {
    id: string
    tenant_id: string
    name: string
    file_url: string
    status: RfpStatus
    clause_count: number
    created_at: string
}

export interface Clause {
    id: string
    rfp_id: string
    tenant_id: string
    clause_text: string
    clause_index: number
    clause_type: ClauseType
    generated_answer: string | null
    confidence_score: number | null
    risk_flag: RiskFlag
    reasoning_summary: string | null
    created_at: string
}

export interface KnowledgeDocument {
    id: string
    tenant_id: string
    name: string
    file_url: string
    file_hash: string | null
    processed: boolean
    created_at: string
}

export interface KnowledgeChunk {
    id: string
    tenant_id: string
    document_id: string
    chunk_text: string
    clause_type: ClauseType
    reuse_count: number
    is_user_approved: boolean
    last_used_at: string | null
    created_at: string
}

// ============================================
// Organization Training
// ============================================

export interface OrganizationTrainingDocument {
    id: string
    tenant_id: string
    document_type: DocumentType
    file_url: string
    processed: boolean
    created_at: string
}

export interface StyleProfile {
    id: string
    tenant_id: string
    avg_sentence_length: number | null
    tone_vector: Record<string, number>
    common_phrases: string[]
    formality_score: number | null
    updated_at: string
}

// ============================================
// Embedding Cache
// ============================================

export interface EmbeddingCache {
    id: string
    text_hash: string
    vector: number[]
    created_at: string
}

// ============================================
// Gmail Integration
// ============================================

export interface GmailConnection {
    id: string
    tenant_id: string
    user_id: string
    google_email: string
    access_token_encrypted: string
    refresh_token_encrypted: string
    token_expiry: string
    connected_at: string
}

export interface EmailLog {
    id: string
    tenant_id: string
    gmail_message_id: string
    subject: string | null
    sender: string | null
    snippet: string | null
    received_at: string | null
    classified_as_rfp: boolean
    classification_method: ClassificationMethod | null
    classification_confidence: number | null
    intent_type: IntentType | null
    processed: boolean
    created_at: string
}

export interface AutoDetectedRfp {
    id: string
    tenant_id: string
    email_log_id: string
    attachment_url: string
    rfp_document_id: string | null
    processing_status: ProcessingStatus
    created_at: string
}

export interface GmailSettings {
    tenant_id: string
    auto_scan_enabled: boolean
    scan_frequency_minutes: number
}

// ============================================
// Usage & Monitoring
// ============================================

export interface UsageMetric {
    id: string
    tenant_id: string
    user_id: string | null
    action_type: string
    tokens_used: number
    latency_ms: number
    cost_estimate: number
    metadata: Record<string, unknown>
    created_at: string
}

// ============================================
// AI Response Types
// ============================================

export interface AIClauseResponse {
    answer: string
    confidence_score: number
    risk_flag: RiskFlag
    reasoning_summary: string
}

export interface AIClassificationResponse {
    is_rfp: boolean
    confidence: number
    intent_type: IntentType
    reason: string
}

export interface AIClauseTypeResponse {
    clause_type: ClauseType
}

// ============================================
// SmartMatch Types
// ============================================

export interface SmartMatchResult {
    text: string
    similarity_score: number
    keyword_overlap_score: number
    recency_weight: number
    reuse_count: number
    final_score: number
    metadata: Record<string, unknown>
}

export interface VectorSearchResult {
    text: string
    similarity_score: number
    metadata: Record<string, unknown>
}

// ============================================
// Plan Configuration
// ============================================

export interface PlanConfig {
    max_rfps_per_month: number | null // null = unlimited
    max_clauses_per_rfp: number | null
    knowledge_vault_limit_mb: number
    advanced_analytics: boolean
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
    starter: {
        max_rfps_per_month: 10,
        max_clauses_per_rfp: 100,
        knowledge_vault_limit_mb: 50,
        advanced_analytics: false,
    },
    growth: {
        max_rfps_per_month: null,
        max_clauses_per_rfp: null,
        knowledge_vault_limit_mb: 250,
        advanced_analytics: true,
    },
}
