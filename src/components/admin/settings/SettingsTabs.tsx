'use client'

import { useState } from 'react'
import { Cpu, Mail, LayoutGrid, Settings as SettingsIcon } from 'lucide-react'

type Tab = {
    id: string
    name: string
    icon: any
}

const tabs: Tab[] = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'communication', name: 'Communication', icon: Mail },
    { id: 'ai', name: 'AI Intelligence', icon: Cpu },
    { id: 'features', name: 'Feature Modules', icon: LayoutGrid },
]

export default function SettingsTabs({ children }: { children: (activeTab: string) => React.ReactNode }) {
    const [activeTab, setActiveTab] = useState('general')

    return (
        <div className="space-y-6">
            <div className="flex overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit min-w-full md:min-w-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${isActive
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-green-600' : ''}`} />
                                {tab.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                {children(activeTab)}
            </div>
        </div>
    )
}
