'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { NAV_SECTIONS } from '@/lib/nav-config'

export default function DesktopNav({ userRole }: { userRole: string }) {
    const [activeSection, setActiveSection] = useState<string | null>(null)

    const filteredSections = NAV_SECTIONS.filter(section =>
        !section.roles || section.roles.includes(userRole)
    )

    return (
        <nav className="hidden md:flex items-center gap-1">
            {filteredSections.map((section) => (
                <div
                    key={section.title}
                    className="relative group"
                    onMouseEnter={() => setActiveSection(section.title)}
                    onMouseLeave={() => setActiveSection(null)}
                >
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                        {section.title}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeSection === section.title ? 'rotate-180' : ''}`} />
                    </button>

                    {activeSection === section.title && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                                        >
                                            <div className="p-1.5 bg-slate-50 group-hover:bg-white group-hover:text-green-600 text-slate-400 rounded-lg shadow-sm transition-colors">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                {item.name}
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </nav>
    )
}
