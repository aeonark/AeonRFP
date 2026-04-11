'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Sparkles, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react'

type AuthMode = 'password' | 'otp' | 'verify_otp'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [authMode, setAuthMode] = useState<AuthMode>('password')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [token, setToken] = useState('')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Show error from callback redirect (e.g. expired link)
    useEffect(() => {
        const error = searchParams.get('error')
        if (error) setErrorMsg(decodeURIComponent(error))
    }, [searchParams])

    async function handlePasswordLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        try {
            // Use server-side login so cookies are set server-side
            // and immediately readable by proxy.ts on next request
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Login failed')
            }

            // Hard navigate — browser uses newly-set server cookies
            window.location.href = '/dashboard'
        } catch (err: any) {
            setErrorMsg(err.message)
            setLoading(false)
        }
    }

    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false, // Don't create new users from OTP login
                }
            })
            if (error) throw new Error(error.message)
            setAuthMode('verify_otp')
            setLoading(false)
        } catch (err: any) {
            setErrorMsg(err.message)
            setLoading(false)
        }
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email'
            })
            if (error) throw new Error(error.message)
            if (!data.session) throw new Error('OTP verification failed. Please try again.')

            window.location.href = '/dashboard'
        } catch (err: any) {
            setErrorMsg(err.message)
            setLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setLoading(true)
        setErrorMsg(null)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center px-4">
            {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] bg-aeon-blue/6 rounded-full blur-[100px] top-1/4 left-1/4 animate-pulse-glow" />

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
                        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">
                            Sign in to your AeonRFP account
                        </p>
                    </div>

                    <div className="space-y-4 mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-input border border-border text-foreground hover:bg-muted transition-all font-medium text-sm disabled:opacity-50"
                        >
                            <Chrome className="w-4 h-4" />
                            Continue with Google
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

                    {authMode === 'verify_otp' ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5 text-center">
                                    Enter the 6-digit code sent to {email}
                                </label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    className="w-full h-14 text-center tracking-widest text-2xl font-bold rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                                />
                            </div>

                            {errorMsg && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">
                                    {errorMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-aeon-blue/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Verify Code <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setAuthMode('otp'); setToken(''); setErrorMsg(null) }}
                                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                            >
                                Didn&apos;t receive a code? Try again
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={authMode === 'password' ? handlePasswordLogin : handleSendOtp} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    required
                                    className="w-full h-11 px-4 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                                />
                            </div>

                            {/* Password - only show in password mode */}
                            {authMode === 'password' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            className="text-xs text-aeon-blue hover:underline"
                                            onClick={() => setAuthMode('otp')}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
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
                            )}

                            {errorMsg && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                    {errorMsg}
                                </div>
                            )}

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
                                        {authMode === 'password' ? 'Sign In' : 'Send Code'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {/* Toggle Auth Mode */}
                            <button
                                type="button"
                                onClick={() => { setAuthMode(authMode === 'password' ? 'otp' : 'password'); setErrorMsg(null) }}
                                className="w-full text-sm text-aeon-blue hover:underline text-center"
                            >
                                {authMode === 'password' ? 'Sign in with One-Time Password instead' : 'Sign in with Password instead'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-aeon-blue hover:underline font-medium">
                            Create one
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-aeon-blue/30 border-t-aeon-blue rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
