/**
 * Check if the Supabase URL is the placeholder value.
 * When true, pages should render demo data instead of making
 * network requests that will fail with ERR_NAME_NOT_RESOLVED.
 */
export function isSupabasePlaceholder(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    return !url || url.includes('placeholder')
}
