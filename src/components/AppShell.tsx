'use client'

import React, { useState } from 'react'
import MobileNav from './MobileNav'
import MobileMenu from './MobileMenu'
import DesktopNav from './DesktopNav'
import { Shield, Bell, LogOut, ChevronLeft, UserCircle } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

interface AppShellProps {
    children: React.ReactNode
    profile: any
    title?: string
    backHref?: string
}

export default function AppShell({ children, profile, title, backHref }: AppShellProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const isAdmin = ['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR'].includes(profile.role)

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased pb-20 md:pb-0">
            {/* Mobile Menu Drawer */}
            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                profile={profile}
            />
            {/* Context-Aware Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {backHref ? (
                            <Link href={backHref} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                                <ChevronLeft className="w-6 h-6" />
                            </Link>
                        ) : (
                            <div className="bg-green-600 p-1.5 rounded-lg shrink-0">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight truncate max-w-[160px] md:max-w-none">
                                {title || 'Obidient Connect'}
                            </h1>
                            {!title && (
                                <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase truncate">
                                    {profile.role?.replace('_', ' ')}
                                </p>
                            )}
                        </div>
                        <div className="hidden md:block ml-8 border-l border-slate-100 pl-6">
                            <DesktopNav />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button className="p-2 text-slate-400 hover:text-green-600 transition relative">
                            <Bell className="w-5 h-5 md:w-6 md:h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900">{profile.full_name}</p>
                                <p className="text-xs text-slate-500">{profile.phone}</p>
                            </div>
                            <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center hover:border-green-500 transition-colors shrink-0">
                                {profile.photo_url ? (
                                    <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-6 h-6 text-slate-300" />
                                )}
                            </Link>
                            <form action={logout}>
                                <button type="submit" className="p-2 md:p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition duration-200">
                                    <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                {children}
            </main>

            {/* Always rendered, hidden on desktop via CSS */}
            <MobileNav isAdmin={isAdmin} onMenuClick={() => setIsMenuOpen(true)} />
        </div>
    )
}
