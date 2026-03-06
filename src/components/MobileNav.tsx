'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Newspaper, LayoutGrid } from 'lucide-react'

export default function MobileNav({ isAdmin, onMenuClick }: { isAdmin: boolean, onMenuClick: () => void }) {
    const pathname = usePathname()

    const navItems = [
        { name: 'Home', href: '/dashboard', icon: Home },
        { name: 'Directory', href: '/directory', icon: Users },
        { name: 'Broadcast', href: '/admin/sms', icon: Newspaper },
        { name: 'Menu', href: '#menu', icon: LayoutGrid, isTrigger: true },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-[100] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    if (item.isTrigger) {
                        return (
                            <button
                                key={item.name}
                                onClick={onMenuClick}
                                className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            >
                                <Icon className="w-5 h-5 mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                            </button>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${isActive ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-green-50' : ''}`} />
                                {isActive && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></span>}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
