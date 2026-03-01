/**
 * Rate Limiter
 * Per-user and per-tenant rate limiting using in-memory sliding window.
 */

interface RateWindow {
    count: number
    windowStart: number
}

const USER_LIMITS = new Map<string, RateWindow>()
const TENANT_LIMITS = new Map<string, RateWindow>()

const RATE_CONFIG = {
    user: {
        maxRequests: 60,       // 60 requests per window
        windowMs: 60 * 1000,   // 1 minute window
    },
    tenant: {
        maxRequests: 500,       // 500 requests per window
        windowMs: 60 * 60 * 1000, // 1 hour window
    },
}

/**
 * Check if a request is within rate limits.
 */
export function checkRateLimit(
    userId: string,
    tenantId: string
): { allowed: boolean; retryAfterMs?: number } {
    // Check user limit
    const userCheck = checkLimit(USER_LIMITS, userId, RATE_CONFIG.user)
    if (!userCheck.allowed) return userCheck

    // Check tenant limit
    const tenantCheck = checkLimit(TENANT_LIMITS, tenantId, RATE_CONFIG.tenant)
    if (!tenantCheck.allowed) return tenantCheck

    return { allowed: true }
}

function checkLimit(
    store: Map<string, RateWindow>,
    key: string,
    config: { maxRequests: number; windowMs: number }
): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now()
    const window = store.get(key)

    if (!window || now - window.windowStart > config.windowMs) {
        // Start new window
        store.set(key, { count: 1, windowStart: now })
        return { allowed: true }
    }

    if (window.count >= config.maxRequests) {
        const retryAfterMs = config.windowMs - (now - window.windowStart)
        return { allowed: false, retryAfterMs }
    }

    window.count++
    return { allowed: true }
}
