'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Mail,
    Link2,
    CheckCircle2,
    Loader2,
    FileText,
    RefreshCw,
    AlertCircle,
    Paperclip,
    Inbox,
    Clock,
    Shield,
    Unlink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Types
// ============================================

interface EmailLog {
    id: string
    subject: string
    sender: string
    received_at: string
    classified_as_rfp: boolean
    classification_confidence: number
    classification_method: string | null
    intent_type: string | null
    snippet: string | null
    processed: boolean
    created_at: string
}

interface GmailConnection {
    id: string
    email: string | null
    connected_at: string
}

// ============================================
// Main Page
// ============================================

export default function GmailPage() {
    const [connection, setConnection] = useState<GmailConnection | null>(null)
    const [emails, setEmails] = useState<EmailLog[]>([])
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [scanResult, setScanResult] = useState<{ scanned: number; rfps: number } | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'rfp' | 'not_rfp'>('all')

    const supabase = createClient()

    // -----------------------------------
    // Load connection status + email logs
    // -----------------------------------
    const loadData = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // Check for Gmail connection
            const { data: conn } = await supabase
                .from('gmail_connections')
                .select('id, email, connected_at')
                .limit(1)
                .single()

            setConnection(conn || null)

            if (conn) {
                // Fetch email logs
                const { data: logs, error: logErr } = await supabase
                    .from('email_logs')
                    .select('*')
                    .order('received_at', { ascending: false })
                    .limit(50)

                if (logErr) throw logErr
                setEmails(logs || [])
            }
        } catch (err) {
            console.error('[gmail] Failed to load data:', err)
            // Not connected is fine — show connect UI
            setConnection(null)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // -----------------------------------
    // Connect Gmail
    // -----------------------------------
    async function handleConnect() {
        setConnecting(true)
        setError(null)
        try {
            const resp = await fetch('/api/connect-gmail', { method: 'POST' })
            const data = await resp.json()

            if (!resp.ok) {
                throw new Error(data.error || 'Failed to connect Gmail')
            }

            // If the API returns an OAuth URL, redirect to it
            if (data.auth_url) {
                window.location.href = data.auth_url
                return
            }

            // Otherwise refresh data
            await loadData()
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to connect Gmail'
            setError(msg)
            setConnecting(false)
        }
    }

    // -----------------------------------
    // Scan Inbox
    // -----------------------------------
    async function handleScan() {
        setScanning(true)
        setError(null)
        setScanResult(null)

        try {
            const resp = await fetch('/api/scan-inbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: 'tenant_aeonark_001',
                    user_id: connection?.id || 'default',
                }),
            })

            const data = await resp.json()

            if (!resp.ok) {
                throw new Error(data.error || 'Scan failed')
            }

            setScanResult({
                scanned: data.scanned || 0,
                rfps: data.rfps_detected || 0,
            })

            // Refresh email list
            const { data: logs } = await supabase
                .from('email_logs')
                .select('*')
                .order('received_at', { ascending: false })
                .limit(50)

            setEmails(logs || [])
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Scan failed'
            setError(msg)
        } finally {
            setScanning(false)
        }
    }

    // -----------------------------------
    // Process RFP from email
    // -----------------------------------
    async function handleProcessRfp(email: EmailLog) {
        setProcessingId(email.id)
        try {
            // Create an RFP document from the email
            const { error: insertErr } = await supabase.from('rfp_documents').insert({
                title: email.subject,
                source: 'gmail',
                status: 'pending',
                tenant_id: 'tenant_aeonark_001',
            })

            if (insertErr) throw insertErr

            // Mark email as processed
            await supabase
                .from('email_logs')
                .update({ processed: true })
                .eq('id', email.id)

            // Update local state
            setEmails((prev) =>
                prev.map((e) => (e.id === email.id ? { ...e, processed: true } : e))
            )
        } catch (err) {
            console.error('[gmail] Process RFP failed:', err)
        } finally {
            setProcessingId(null)
        }
    }

    // -----------------------------------
    // Filtered emails
    // -----------------------------------
    const filteredEmails = emails.filter((e) => {
        if (filter === 'rfp') return e.classified_as_rfp
        if (filter === 'not_rfp') return !e.classified_as_rfp
        return true
    })

    const rfpCount = emails.filter((e) => e.classified_as_rfp).length
    const unprocessedRfps = emails.filter((e) => e.classified_as_rfp && !e.processed).length

    // -----------------------------------
    // Time formatting
    // -----------------------------------
    function timeAgo(dateStr: string): string {
        const date = new Date(dateStr)
        const now = Date.now()
        const diffMs = now - date.getTime()
        const mins = Math.floor(diffMs / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    // -----------------------------------
    // Loading state
    // -----------------------------------
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto flex items-center justify-center py-32 animate-fade-in">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-aeon-blue animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading inbox…</p>
                </div>
            </div>
        )
    }

    // -----------------------------------
    // Render
    // -----------------------------------
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    Gmail Inbox
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Connect Gmail to auto-detect incoming RFPs and procurement emails.
                </p>
            </div>

            {!connection ? (
                /* ===========================
                   Not Connected — Connect UI
                   =========================== */
                <div className="glass-card rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-aeon-blue/10 flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-7 h-7 text-aeon-blue" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Connect Your Gmail</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                        Securely connect your work email to automatically detect and process incoming RFP requests.
                    </p>
                    {error && (
                        <div className="flex items-center gap-2 justify-center text-destructive text-sm mb-4">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all disabled:opacity-50"
                    >
                        {connecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Link2 className="w-4 h-4" />
                        )}
                        {connecting ? 'Connecting…' : 'Connect Gmail Account'}
                    </button>
                    <p className="text-xs text-muted-foreground mt-4">
                        Read-only access · We never send emails on your behalf
                    </p>
                </div>
            ) : (
                <>
                    {/* ===========================
                       Connected — Status Bar
                       =========================== */}
                    <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-aeon-emerald" />
                            <div>
                                <div className="text-sm font-medium">
                                    {connection.email || 'Gmail Connected'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Connected · {emails.length} emails scanned
                                    {unprocessedRfps > 0 && (
                                        <span className="text-aeon-emerald ml-1">
                                            · {unprocessedRfps} new RFP{unprocessedRfps > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-sm font-medium hover:shadow-lg hover:shadow-aeon-blue/20 transition-all disabled:opacity-50"
                            >
                                {scanning ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                {scanning ? 'Scanning…' : 'Scan Now'}
                            </button>
                        </div>
                    </div>

                    {/* Scan result toast */}
                    {scanResult && (
                        <div className="glass-card rounded-xl p-3 flex items-center gap-3 bg-aeon-emerald/5 border-aeon-emerald/20">
                            <CheckCircle2 className="w-4 h-4 text-aeon-emerald shrink-0" />
                            <span className="text-sm">
                                Scanned <strong>{scanResult.scanned}</strong> new email{scanResult.scanned !== 1 ? 's' : ''} ·{' '}
                                <strong className="text-aeon-emerald">{scanResult.rfps}</strong> RFP{scanResult.rfps !== 1 ? 's' : ''} detected
                            </span>
                            <button
                                onClick={() => setScanResult(null)}
                                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="glass-card rounded-xl p-3 flex items-center gap-3 bg-destructive/5 border-destructive/20">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                            <span className="text-sm text-destructive">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Stats + Filters */}
                    {emails.length > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Inbox className="w-3.5 h-3.5" />
                                    {emails.length} emails
                                </span>
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-aeon-emerald" />
                                    {rfpCount} RFPs
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {(['all', 'rfp', 'not_rfp'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
                                                ? 'bg-aeon-blue/10 text-aeon-blue'
                                                : 'text-muted-foreground hover:bg-secondary'
                                            }`}
                                    >
                                        {f === 'all' ? 'All' : f === 'rfp' ? 'RFPs Only' : 'Non-RFP'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email list */}
                    {filteredEmails.length > 0 ? (
                        <div className="space-y-3">
                            {filteredEmails.map((email) => (
                                <div
                                    key={email.id}
                                    className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-all ${email.classified_as_rfp && !email.processed
                                            ? 'border-aeon-emerald/20 bg-aeon-emerald/[0.02]'
                                            : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${email.classified_as_rfp
                                                ? 'bg-aeon-emerald/10'
                                                : 'bg-secondary'
                                            }`}
                                    >
                                        {email.classified_as_rfp ? (
                                            <FileText className="w-5 h-5 text-aeon-emerald" />
                                        ) : (
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {email.subject || '(no subject)'}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                            <span className="truncate max-w-[200px]">
                                                {email.sender}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo(email.received_at)}
                                            </span>
                                            {email.classification_method && (
                                                <span className="flex items-center gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    {email.classification_method}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges + Actions */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Confidence badge */}
                                        {email.classified_as_rfp ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-aeon-emerald/10 text-aeon-emerald">
                                                RFP ({email.classification_confidence}%)
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                                Not RFP
                                            </span>
                                        )}

                                        {/* Process RFP button */}
                                        {email.classified_as_rfp && !email.processed && (
                                            <button
                                                onClick={() => handleProcessRfp(email)}
                                                disabled={processingId === email.id}
                                                className="px-3 py-1.5 rounded-lg bg-aeon-blue text-white text-xs font-medium hover:bg-aeon-blue/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {processingId === email.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <FileText className="w-3 h-3" />
                                                )}
                                                {processingId === email.id ? 'Processing…' : 'Process RFP'}
                                            </button>
                                        )}

                                        {/* Processed check */}
                                        {email.classified_as_rfp && email.processed && (
                                            <CheckCircle2 className="w-4 h-4 text-aeon-emerald" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">
                                {filter !== 'all'
                                    ? 'No emails match this filter.'
                                    : 'No emails scanned yet. Click "Scan Now" to fetch your inbox.'}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
