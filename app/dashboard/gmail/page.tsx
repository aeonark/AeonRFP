'use client'

import { useState } from 'react'
import { Mail, Link2, CheckCircle2, AlertCircle, Loader2, FileText, RefreshCw, Search } from 'lucide-react'

interface EmailLog {
    id: string
    subject: string
    sender: string
    receivedAt: string
    isRfp: boolean
    confidence: number
    hasAttachment: boolean
    processed: boolean
}

const mockEmails: EmailLog[] = [
    { id: '1', subject: 'RFP: Enterprise Cloud Migration Services', sender: 'procurement@agency.gov', receivedAt: '1h ago', isRfp: true, confidence: 95, hasAttachment: true, processed: true },
    { id: '2', subject: 'Meeting reminder: Q3 Review', sender: 'calendar@company.com', receivedAt: '2h ago', isRfp: false, confidence: 5, hasAttachment: false, processed: true },
    { id: '3', subject: 'Tender Notice: IT Infrastructure Upgrade', sender: 'bids@contractor.org', receivedAt: '3h ago', isRfp: true, confidence: 88, hasAttachment: true, processed: true },
    { id: '4', subject: 'Request for Information - Security Assessment', sender: 'security@enterprise.com', receivedAt: '5h ago', isRfp: true, confidence: 72, hasAttachment: true, processed: false },
    { id: '5', subject: 'Newsletter: Industry Updates', sender: 'news@trade.org', receivedAt: '6h ago', isRfp: false, confidence: 3, hasAttachment: false, processed: true },
]

export default function GmailPage() {
    const [connected, setConnected] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [emails, setEmails] = useState<EmailLog[]>([])

    function handleConnect() {
        setConnected(true)
        setEmails(mockEmails)
    }

    function handleScan() {
        setScanning(true)
        setTimeout(() => setScanning(false), 2000)
    }

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

            {!connected ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-aeon-blue/10 flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-7 h-7 text-aeon-blue" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Connect Your Gmail</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                        Securely connect your work email to automatically detect and process incoming RFP requests.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all"
                    >
                        <Link2 className="w-4 h-4" />
                        Connect Gmail Account
                    </button>
                    <p className="text-xs text-muted-foreground mt-4">
                        Read-only access · We never send emails on your behalf
                    </p>
                </div>
            ) : (
                <>
                    {/* Connected status */}
                    <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-aeon-emerald" />
                            <div>
                                <div className="text-sm font-medium">admin@aeonark.com</div>
                                <div className="text-xs text-muted-foreground">Connected · Last scan: 5 mins ago</div>
                            </div>
                        </div>
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                            {scanning ? 'Scanning...' : 'Scan Now'}
                        </button>
                    </div>

                    {/* Email list */}
                    <div className="space-y-3">
                        {emails.map((email) => (
                            <div key={email.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${email.isRfp ? 'bg-aeon-emerald/10' : 'bg-secondary'
                                    }`}>
                                    {email.isRfp ? (
                                        <FileText className="w-5 h-5 text-aeon-emerald" />
                                    ) : (
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{email.subject}</div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span>{email.sender}</span>
                                        <span>{email.receivedAt}</span>
                                        {email.hasAttachment && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> Attachment
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {email.isRfp ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-aeon-emerald/10 text-aeon-emerald">
                                            RFP ({email.confidence}%)
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                            Not RFP
                                        </span>
                                    )}
                                    {email.isRfp && !email.processed && (
                                        <button className="px-3 py-1.5 rounded-lg bg-aeon-blue text-white text-xs font-medium hover:bg-aeon-blue/90 transition-colors">
                                            Process
                                        </button>
                                    )}
                                    {email.isRfp && email.processed && (
                                        <CheckCircle2 className="w-4 h-4 text-aeon-emerald" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
