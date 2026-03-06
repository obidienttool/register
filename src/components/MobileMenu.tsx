'use client'

import React from 'react'
import Link from 'next/link'
import {
    X, LayoutGrid, Users, Megaphone,
    BarChart3, BrainCircuit, Landmark,
    Settings, LogOut, Info, ClipboardList, UserCircle
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    profile: any
}

export default function MobileMenu({ isOpen, onClose, profile }: MobileMenuProps) {
    if (!isOpen) return null

    const isAdmin = profile.role === 'ADMIN'
    const isCoord = 1 // Simplified check for now

    const sections = [
        {
            title: 'Directory',
            items: [
                { name: 'Members Directory', href: '/admin/members', icon: Users },
                { name: 'Unregistered', href: '/admin/unregistered-members', icon: ClipboardList },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'SMS Broadcast', href: '/admin/sms', icon: Megaphone },
                { name: 'Polling Units', href: '/admin/polling-units', icon: Landmark },
                //{ name: 'Team Logs', href: '/admin/manager', icon: ClipboardList },
            ]
        },
        {
            title: 'Insights',
            items: [
                { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
                { name: 'AI Intelligence', href: '/admin/intelligence', icon: BrainCircuit },
            ]
        }
    ]

    return (
        <div className="fixed inset-0 z-[200] md:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Menu Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto">
                <div className="p-6 pb-24">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-xl">
                                <LayoutGrid className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Command Center</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{section.title}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {section.items.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={onClose}
                                                className="flex flex-col gap-3 p-4 bg-slate-50 hover:bg-green-50 rounded-2xl border border-slate-100 transition group"
                                            >
                                                <div className="bg-white p-2 w-fit rounded-lg shadow-sm group-hover:text-green-600 text-slate-500">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 leading-tight">{item.name}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 space-y-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">System</h3>
                            <div className="flex flex-col gap-2">
                                {isAdmin && (
                                    <Link href="/admin/settings" onClick={onClose} className="flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-sm">
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-5 h-5" /> System Configuration
                                        </div>
                                    </Link>
                                )}
                                <Link href="/profile" onClick={onClose} className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm">
                                    <div className="flex items-center gap-3">
                                        <UserCircle className="w-5 h-5 text-slate-400" /> Account Profile
                                    </div>
                                </Link>
                                <form action={logout}>
                                    <button type="submit" className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm text-left">
                                        <div className="flex items-center gap-3">
                                            <LogOut className="w-5 h-5" /> Sign Out
                                        </div>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
