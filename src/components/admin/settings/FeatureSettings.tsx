'use client'

import { LayoutGrid } from 'lucide-react'
import { SettingsSection } from './BaseSettings'

export default function FeatureSettings({ settings, onUpdate, isPending }: {
    settings: any[], onUpdate: any, isPending: boolean
}) {
    const featureSettings = settings.filter(s => s.id.startsWith('feature_'))

    if (featureSettings.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                <LayoutGrid className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">No feature toggles currently configured.</p>
            </div>
        )
    }

    return (
        <SettingsSection title="Module Management" icon={LayoutGrid}>
            {featureSettings.map(s => (
                <div key={s.id} className="p-6 hover:bg-slate-50/50 transition border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">
                                    {s.id}
                                </span>
                            </div>
                            <p className="text-sm text-slate-900 font-bold mb-1">{s.description}</p>
                        </div>
                        <button
                            onClick={() => onUpdate(s.id, s.value === 'true' ? 'false' : 'true')}
                            disabled={isPending}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-500/10 ${s.value === 'true' ? 'bg-green-600' : 'bg-slate-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${s.value === 'true' ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>
                </div>
            ))}
        </SettingsSection>
    )
}
