import * as Dialog from '@radix-ui/react-dialog'
import { Shield, X, Lock, Eye, CheckCircle2 } from 'lucide-react'

interface PrivacyPolicyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAgree: () => void
}

export function PrivacyPolicyModal({ open, onOpenChange, onAgree }: PrivacyPolicyModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg sm:rounded-2xl animate-fade-in">
                    
                    <div className="flex flex-col items-center text-center gap-2 mb-2">
                        <div className="w-12 h-12 rounded-full bg-aeon-blue/10 flex items-center justify-center mb-2">
                            <Shield className="w-6 h-6 text-aeon-blue" />
                        </div>
                        <Dialog.Title className="text-xl font-bold">Gmail Integration Security & Privacy</Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground">
                            Before connecting your Gmail account, please review our data access policy.
                        </Dialog.Description>
                    </div>

                    <div className="space-y-4 my-2 text-sm text-muted-foreground">
                        <div className="flex gap-3">
                            <Lock className="w-5 h-5 text-aeon-emerald shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-foreground block mb-1">Read-Only Access</strong>
                                We only request read access to your inbox to locate emails with RFP documents (PDFs/DOCX). We cannot send emails, delete emails, or change your settings.
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Eye className="w-5 h-5 text-aeon-blue shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-foreground block mb-1">Strict Isolation</strong>
                                We do not store or read the body text of your personal emails. Only the attached documents you explicitly select will be processed by our AI pipeline.
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-aeon-violet shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-foreground block mb-1">Revoke Anytime</strong>
                                You maintain full control. You can revoke this access connection directly from your dashboard or via your Google Security settings at any moment.
                            </div>
                        </div>
                    </div>

                    <div className="bg-secondary/50 rounded-xl p-4 mt-2 border border-border/50 text-xs text-muted-foreground text-center">
                        By clicking "I Agree & Connect", you consent to these terms and will be redirected to Google to authorize access.
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onAgree}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-sm font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all"
                        >
                            I Agree & Connect
                        </button>
                    </div>

                    <Dialog.Close asChild>
                        <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
