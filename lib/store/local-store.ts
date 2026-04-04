/**
 * Local Data Store
 * 
 * Provides a localStorage-backed storage layer for RFP documents and clauses.
 * Used when Supabase is not configured (placeholder credentials).
 * All pages import from this module for consistent data access.
 */

// ============================================
// Types
// ============================================

export interface StoredRFP {
    id: string
    title: string
    status: 'uploaded' | 'processing' | 'completed' | 'failed'
    clause_count: number | null
    created_at: string
    file_name: string
    file_size: number
    error_message?: string
}

export interface StoredClause {
    id: string
    rfp_id: string
    clause_index: number
    clause_text: string
    clause_type: 'technical' | 'compliance' | 'financial' | 'operational' | 'legal' | 'general'
    confidence_score: number | null
    generated_answer: string | null
    reasoning_summary: string | null
    risk_flag: 'low' | 'medium' | 'high' | null
    status: 'pending' | 'complete' | 'generating' | 'error'
    created_at: string
}

// ============================================
// Storage Keys
// ============================================

const RFPS_KEY = 'aeonrfp_rfps'
const CLAUSES_KEY = 'aeonrfp_clauses'

// ============================================
// In-memory cache (avoids repeated JSON.parse)
// ============================================

let rfpCache: StoredRFP[] | null = null
let clauseCache: StoredClause[] | null = null

function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

// ============================================
// RFP Document Operations
// ============================================

function loadRFPs(): StoredRFP[] {
    if (rfpCache) return rfpCache
    if (!isBrowser()) return []

    try {
        const raw = localStorage.getItem(RFPS_KEY)
        rfpCache = raw ? JSON.parse(raw) : []
        return rfpCache!
    } catch {
        rfpCache = []
        return []
    }
}

function saveRFPs(rfps: StoredRFP[]) {
    rfpCache = rfps
    if (isBrowser()) {
        localStorage.setItem(RFPS_KEY, JSON.stringify(rfps))
    }
}

export function getRFPs(): StoredRFP[] {
    return loadRFPs().sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

export function getRFP(id: string): StoredRFP | undefined {
    return loadRFPs().find((r) => r.id === id)
}

export function addRFP(rfp: Omit<StoredRFP, 'id' | 'created_at'>): StoredRFP {
    const newRFP: StoredRFP = {
        ...rfp,
        id: generateId(),
        created_at: new Date().toISOString(),
    }
    const rfps = loadRFPs()
    rfps.push(newRFP)
    saveRFPs(rfps)
    return newRFP
}

export function updateRFP(id: string, updates: Partial<StoredRFP>) {
    const rfps = loadRFPs()
    const idx = rfps.findIndex((r) => r.id === id)
    if (idx !== -1) {
        rfps[idx] = { ...rfps[idx], ...updates }
        saveRFPs(rfps)
    }
}

// ============================================
// Clause Operations
// ============================================

function loadClauses(): StoredClause[] {
    if (clauseCache) return clauseCache
    if (!isBrowser()) return []

    try {
        const raw = localStorage.getItem(CLAUSES_KEY)
        clauseCache = raw ? JSON.parse(raw) : []
        return clauseCache!
    } catch {
        clauseCache = []
        return []
    }
}

function saveClauses(clauses: StoredClause[]) {
    clauseCache = clauses
    if (isBrowser()) {
        localStorage.setItem(CLAUSES_KEY, JSON.stringify(clauses))
    }
}

export function getClauses(rfpId: string): StoredClause[] {
    return loadClauses()
        .filter((c) => c.rfp_id === rfpId)
        .sort((a, b) => a.clause_index - b.clause_index)
}

export function getAllClauses(): StoredClause[] {
    return loadClauses()
}

export function addClauses(clauses: Omit<StoredClause, 'id' | 'created_at'>[]): StoredClause[] {
    const existing = loadClauses()
    const newClauses = clauses.map((c) => ({
        ...c,
        id: generateId(),
        created_at: new Date().toISOString(),
    }))
    saveClauses([...existing, ...newClauses])
    return newClauses
}

export function updateClause(id: string, updates: Partial<StoredClause>) {
    const clauses = loadClauses()
    const idx = clauses.findIndex((c) => c.id === id)
    if (idx !== -1) {
        clauses[idx] = { ...clauses[idx], ...updates }
        saveClauses(clauses)
    }
}

/**
 * Invalidate caches so next read re-parses from localStorage.
 * Useful after external changes (e.g., another tab updated storage).
 */
export function invalidateCache() {
    rfpCache = null
    clauseCache = null
}

// ============================================
// Utilities
// ============================================

function generateId(): string {
    // Collision-resistant random ID
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 10)
    )
}
