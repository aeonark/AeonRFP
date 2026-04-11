'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, Eye, EyeOff, ArrowRight, Chrome, CheckCircle } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        company: '',
        email: '',
        password: '',
    })
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    function update(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleGoogleSignup() {
        setLoading(true)
        setErrorMsg(null)
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        setSuccessMsg(null)

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    fullName: form.name,
                    company: form.company,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Signup failed')
            }

            if (result.needsConfirmation) {
                // Email confirmation is ON — show success message
                setSuccessMsg(result.message)
                setLoading(false)
                return
            }

            // No email confirmation needed — go straight to dashboard
            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            setErrorMsg(err.message)
            setLoading(false)
        }
    }

    // Show success (email confirmation sent) state
    if (successMsg) {
        return (
            <div className="min-h-screen bg-background relative flex items-center justify-center px-4">
                <div className="fixed inset-0 mesh-gradient pointer-events-none" />
                <div className="relative z-10 w-full max-w-md">
                    <div className="glass-card rounded-2xl p-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-aeon-emerald/10 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="w-8 h-8 text-aeon-emerald" />
                        </div>
                        <h1 className="text-2xl font-bold mb-3">Check your email</h1>
                        <p className="text-sm text-muted-foreground mb-2">
                            We sent a confirmation link to:
                        </p>
                        <p className="text-sm font-semibold text-foreground mb-6">{form.email}</p>
                        <p className="text-xs text-muted-foreground mb-8">
                            Click the link in the email to activate your account, then come back to sign in.
                        </p>
                        <Link
                            href="/login"
                            className="w-full h-11 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-aeon-blue/20 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Go to Sign In <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-12">
            <div className="fixed inset-0 mesh-gradient pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] bg-aeon-violet/6 rounded-full blur-[100px] bottom-1/4 right-1/4 animate-pulse-glow" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aeon-blue to-aeon-violet flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">AeonRFP</span>
                </div>

                {/* Card */}
                <div className="glass-card rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                        <p className="text-sm text-muted-foreground">
                            Start your free trial — no credit card required
                        </p>
                    </div>

                    <div className="space-y-4 mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-input border border-border text-foreground hover:bg-muted transition-all font-medium text-sm disabled:opacity-50"
                        >
                            <Chrome className="w-4 h-4" />
                            Sign up with Google
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                placeholder="Jane Doe"
                                required
                                className="w-full h-11 px-4 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                            />
                        </div>

                        {/* Company */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={form.company}
                                onChange={(e) => update('company', e.target.value)}
                                placeholder="Acme Corp"
                                required
                                className="w-full h-11 px-4 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Work Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                                placeholder="jane@acme.com"
                                required
                                className="w-full h-11 px-4 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => update('password', e.target.value)}
                                    placeholder="Min 8 characters"
                                    required
                                    minLength={8}
                                    className="w-full h-11 px-4 pr-11 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                {errorMsg}
                            </div>
                        )}

                        {/* Terms */}
                        <p className="text-xs text-muted-foreground">
                            By creating an account, you agree to our{' '}
                            <a href="#" className="text-aeon-blue hover:underline">Terms</a> and{' '}
                            <a href="#" className="text-aeon-blue hover:underline">Privacy Policy</a>.
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-aeon-blue/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-aeon-blue hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
