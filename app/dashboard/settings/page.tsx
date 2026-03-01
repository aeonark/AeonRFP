'use client'

import { Settings, Shield, Bell, Database, Users, Zap } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your organization and account preferences.
                </p>
            </div>

            {/* Organization */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-aeon-blue" /> Organization
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Company Name</label>
                        <input
                            type="text"
                            defaultValue="Aeonark Labs"
                            className="w-full h-10 px-4 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-aeon-blue/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Tenant ID</label>
                        <input
                            type="text"
                            value="tenant_aeonark_001"
                            readOnly
                            className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-sm text-muted-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Plan */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-aeon-violet" /> Plan & Usage
                </h2>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-sm font-medium">Current Plan:</span>
                        <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-aeon-blue/10 text-aeon-blue">
                            Starter
                        </span>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-aeon-blue to-aeon-violet text-white text-xs font-semibold hover:shadow-lg hover:shadow-aeon-blue/20 transition-all">
                        Upgrade to Growth
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">RFPs this month</span>
                            <span>7 / 10</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-aeon-blue" style={{ width: '70%' }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Knowledge Vault</span>
                            <span>11.4 MB / 50 MB</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-aeon-emerald" style={{ width: '22.8%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-aeon-emerald" /> Security
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">Two-Factor Authentication</div>
                            <div className="text-xs text-muted-foreground">Add extra security to your account</div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors">
                            Enable
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">Session Management</div>
                            <div className="text-xs text-muted-foreground">1 active session</div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors">
                            Manage
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4 text-chart-4" /> Notifications
                </h2>
                <div className="space-y-3">
                    {[
                        'Email me when an RFP completes processing',
                        'Email me when a new RFP is auto-detected',
                        'Weekly analytics summary',
                    ].map((label) => (
                        <label key={label} className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm">{label}</span>
                            <div className="relative w-10 h-5">
                                <input type="checkbox" defaultChecked className="peer sr-only" />
                                <div className="w-10 h-5 bg-secondary rounded-full peer-checked:bg-aeon-blue transition-colors" />
                                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}
