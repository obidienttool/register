'use client'

import { Save, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

type AppSetting = {
    id: string
    value: string
    description: string
    is_secret: boolean
}

export function SettingRow({
    item,
    onUpdate,
    isPending,
    isTextArea = false
}: {
    item: AppSetting,
    onUpdate: (id: string, value: string) => void,
    isPending: boolean,
    isTextArea?: boolean
}) {
    const [localValue, setLocalValue] = useState(item.value)
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div className="p-6 hover:bg-slate-50/50 transition border-b border-slate-100 last:border-0">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">
                            {item.id}
                        </span>
                        {item.is_secret && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-sm text-slate-900 font-bold mb-1">{item.description}</p>
                </div>

                <div className="flex-1 max-w-xl w-full">
                    <div className="relative group">
                        {isTextArea ? (
                            <textarea
                                className="w-full text-xs font-mono border border-slate-200 rounded-2xl p-4 min-h-[160px] focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all shadow-sm bg-slate-50 font-medium"
                                value={localValue}
                                onChange={(e) => setLocalValue(e.target.value)}
                                onBlur={() => localValue !== item.value && onUpdate(item.id, localValue)}
                            />
                        ) : (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={item.is_secret && !isVisible ? 'password' : 'text'}
                                        className={`w-full text-xs font-mono border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all shadow-sm bg-slate-50 font-medium ${item.is_secret ? 'pr-10' : ''}`}
                                        value={localValue}
                                        onChange={(e) => setLocalValue(e.target.value)}
                                        onBlur={() => localValue !== item.value && onUpdate(item.id, localValue)}
                                    />
                                    {item.is_secret && (
                                        <button
                                            type="button"
                                            onClick={() => setIsVisible(!isVisible)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        >
                                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 px-1">
                        <Save className={`w-3 h-3 ${isPending ? 'animate-pulse text-green-500' : 'text-slate-300'}`} />
                        {isPending ? 'Syncing...' : 'Autosaves on focus loss'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export function SettingsSection({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                    <Icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-xs">{title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {children}
            </div>
        </div>
    )
}
