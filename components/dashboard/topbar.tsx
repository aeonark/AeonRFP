'use client'

import { Bell, Search, User } from 'lucide-react'

export function Topbar() {
    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search RFPs, clauses, documents..."
                        className="w-full h-9 pl-10 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aeon-blue/50 transition-all"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-aeon-blue rounded-full" />
                </button>

                {/* User */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium">Admin User</div>
                        <div className="text-xs text-muted-foreground">Aeonark Labs</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-aeon-blue to-aeon-violet flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        </header>
    )
}
