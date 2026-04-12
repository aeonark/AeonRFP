'use client'

import { useState, useEffect } from 'react'
import { Inbox, Mail, Paperclip, DownloadCloud, Loader2, AlertCircle, ArrowRight, FileText } from 'lucide-react'
import { PrivacyPolicyModal } from '../modals/PrivacyPolicyModal'

interface EmailAttachment {
    filename: string
    mimeType: string
    attachmentId: string
    size: number
}

interface Email {
    id: string
    subject: string
    from: string
    date: string
    snippet: string
    attachments: EmailAttachment[]
}

export function GmailInbox({ onFileStarted }: { onFileStarted: (rfpId: string, filename: string) => void }) {
    const [connected, setConnected] = useState<boolean | null>(null)
    const [userEmail, setUserEmail] = useState<string>('')
    const [emails, setEmails] = useState<Email[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showPrivacyModal, setShowPrivacyModal] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchInbox()
    }, [])

    async function fetchInbox() {
        try {
            setLoading(true)
            const res = await fetch('/api/gmail/list')
            const data = await res.json()

            if (res.ok) {
                setConnected(data.connected)
                if (data.connected) {
                    setUserEmail(data.email)
                    setEmails(data.emails)
                } else if (data.debug) {
                    console.error("Gmail Debug Info:", data.debug)
                    if (data.debug.dbErr) {
                        setError(`Database Error: ${data.debug.dbErr.message || 'Check connection'}`)
                    } else if (!data.debug.integration) {
                        setError(`Missing DB Record: User not found in user_integrations table`)
                    }
                }
            } else {
                setError(data.error || 'Failed to check connection')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setLoading(false)
        }
    }

    function handleConnect() {
        setShowPrivacyModal(true)
    }

    function agreeAndConnect() {
        window.location.href = '/api/integrations/google/auth'
    }

    async function handleProcessAttachment(emailId: string, attachment: EmailAttachment) {
        setProcessingId(attachment.attachmentId)
        try {
            const res = await fetch('/api/gmail/process-attachment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: emailId,
                    attachmentId: attachment.attachmentId,
                    filename: attachment.filename,
                    mimeType: attachment.mimeType
                })
            })
            
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Processing failed')
            
            // Notify parent component that this file is now processing in the background!
            onFileStarted(data.rfp_id, attachment.filename)
            
        } catch (err: any) {
             alert(err.message)
        } finally {
             setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-aeon-blue mb-4" />
                <p className="text-sm">Connecting to Gmail...</p>
            </div>
        )
    }

    if (!connected) {
        return (
            <>
                <div className="border-2 border-dashed border-border/60 rounded-2xl p-12 text-center bg-secondary/20">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center gap-2 text-left">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <span className="font-semibold block">Connection Error</span>
                                {error}
                            </div>
                        </div>
                    )}
                    <div className="w-16 h-16 rounded-2xl bg-[#ea4335]/10 flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-[#ea4335]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect your Gmail Inbox</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                        Instantly import RFP documents straight from your emails. We automatically filter your inbox for unread RFPs with PDF/DOCX attachments.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ea4335] to-[#fbbc05] text-white font-semibold shadow-lg shadow-[#ea4335]/20 hover:shadow-[#ea4335]/40 transition-all"
                    >
                        Securely Connect Gmail
                    </button>
                </div>
                <PrivacyPolicyModal 
                    open={showPrivacyModal} 
                    onOpenChange={setShowPrivacyModal}
                    onAgree={agreeAndConnect}
                />
            </>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#ea4335]/5 border border-[#ea4335]/10">
                <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#ea4335]" />
                    <div>
                        <div className="text-sm font-semibold">Connected to Gmail</div>
                        <div className="text-xs text-muted-foreground">{userEmail}</div>
                    </div>
                </div>
                <button 
                    onClick={fetchInbox}
                    className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border text-foreground hover:bg-secondary transition-colors"
                >
                    Refresh Inbox
                </button>
            </div>

            {error && (
                 <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" /> {error}
                 </div>
            )}

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Emails with Attachments
                </h3>
                
                {emails.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm glass-card rounded-xl">
                        No recent emails containing PDF, DOCX, or XLSX files found.
                    </div>
                ) : (
                    emails.map(email => (
                        <div key={email.id} className="glass-card rounded-xl p-4 transition-all hover:border-aeon-blue/30">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold truncate">{email.subject}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate mb-2">
                                        From: {email.from.replace(/<.*>/, '')} • {new Date(email.date).toLocaleDateString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">"{email.snippet}"</p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0 sm:w-64">
                                    {email.attachments.map(att => (
                                        <div key={att.attachmentId} className="flex flex-col md:flex-row items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/50">
                                            <FileText className="w-4 h-4 text-aeon-blue shrink-0" />
                                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                                <span className="text-xs font-medium truncate" title={att.filename}>{att.filename}</span>
                                                <span className="text-[10px] text-muted-foreground shrink-0 hidden md:block">{(att.size/1024).toFixed(0)} KB</span>
                                            </div>
                                            <button
                                                disabled={processingId === att.attachmentId}
                                                onClick={() => handleProcessAttachment(email.id, att)}
                                                className="shrink-0 px-2 py-1 rounded bg-aeon-blue/10 text-aeon-blue text-[10px] font-semibold hover:bg-aeon-blue/20 transition-colors disabled:opacity-50"
                                            >
                                                {processingId === att.attachmentId ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                                ) : (
                                                    'Process'
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
