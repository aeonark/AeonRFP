/**
 * Plan Enforcement
 * Checks tenant plan limits before allowing actions.
 */

import { PLAN_CONFIGS } from '@/types/database'
import type { PlanType } from '@/types/database'

interface EnforcementResult {
    allowed: boolean
    reason?: string
    usage?: { current: number; limit: number | null }
}

/**
 * Enforce plan limits for a given action.
 * In production, queries live DB values.
 */
export async function enforcePlanLimits(
    tenantId: string,
    actionType: 'create_rfp' | 'process_clause' | 'upload_knowledge'
): Promise<EnforcementResult> {
    // In production, fetch from DB:
    // const { data: tenant } = await supabase
    //   .from('tenants')
    //   .select('*')
    //   .eq('id', tenantId)
    //   .single()

    // Placeholder tenant data for MVP
    const tenant = {
        plan_type: 'starter' as PlanType,
        usage_rfps_this_month: 7,
        vault_storage_used_mb: 11.4,
    }

    const planConfig = PLAN_CONFIGS[tenant.plan_type]

    switch (actionType) {
        case 'create_rfp': {
            if (planConfig.max_rfps_per_month === null) {
                return { allowed: true }
            }
            if (tenant.usage_rfps_this_month >= planConfig.max_rfps_per_month) {
                return {
                    allowed: false,
                    reason: `Monthly RFP limit reached (${planConfig.max_rfps_per_month})`,
                    usage: {
                        current: tenant.usage_rfps_this_month,
                        limit: planConfig.max_rfps_per_month,
                    },
                }
            }
            // Warn at 80%
            if (tenant.usage_rfps_this_month >= planConfig.max_rfps_per_month * 0.8) {
                console.log(`[PLAN] Tenant ${tenantId} at ${tenant.usage_rfps_this_month}/${planConfig.max_rfps_per_month} RFPs`)
            }
            return { allowed: true }
        }

        case 'process_clause': {
            // Clause limits are per-RFP, checked at processing time
            return { allowed: true }
        }

        case 'upload_knowledge': {
            if (tenant.vault_storage_used_mb >= planConfig.knowledge_vault_limit_mb) {
                return {
                    allowed: false,
                    reason: `Knowledge vault limit reached (${planConfig.knowledge_vault_limit_mb}MB)`,
                    usage: {
                        current: tenant.vault_storage_used_mb,
                        limit: planConfig.knowledge_vault_limit_mb,
                    },
                }
            }
            return { allowed: true }
        }

        default:
            return { allowed: true }
    }
}

/**
 * Check if an upgrade should be suggested.
 */
export function shouldSuggestUpgrade(
    planType: PlanType,
    usage: {
        rfpsThisMonth: number
        vaultMb: number
    }
): { suggest: boolean; reason: string } {
    const config = PLAN_CONFIGS[planType]

    if (config.max_rfps_per_month && usage.rfpsThisMonth >= config.max_rfps_per_month * 0.8) {
        return { suggest: true, reason: 'Approaching monthly RFP limit' }
    }

    if (usage.vaultMb >= config.knowledge_vault_limit_mb * 0.85) {
        return { suggest: true, reason: 'Knowledge vault nearing capacity' }
    }

    if (!config.advanced_analytics) {
        return { suggest: true, reason: 'Unlock advanced analytics with Growth plan' }
    }

    return { suggest: false, reason: '' }
}
