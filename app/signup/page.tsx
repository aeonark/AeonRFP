'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        company: '',
        email: '',
        password: '',
    })

    function update(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        // TODO: Integrate Supabase Auth + create tenant
        await new Promise((r) => setTimeout(r, 1500))
        window.location.href = '/dashboard'
    }

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center px-4">
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
