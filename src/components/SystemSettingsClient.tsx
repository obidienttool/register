'use client'

import { useState, useTransition } from 'react'
import { Save, ShieldCheck, Eye, EyeOff, Key, Cpu, MessageSquare } from 'lucide-react'
import { updateAppSetting } from '@/app/actions/config'

type AppSetting = {
    id: string
    value: string
    description: string
    is_secret: boolean
}

export default function SystemSettingsClient({ initialSettings }: { initialSettings: AppSetting[] }) {
    const [settings, setSettings] = useState<AppSetting[]>(initialSettings)
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
    const [isPending, startTransition] = useTransition()

    const handleUpdate = async (id: string, value: string) => {
        startTransition(async () => {
            const res = await updateAppSetting(id, value)
            if (res.success) {
                setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s))
            } else {
                alert(res.error || 'Update failed')
            }
        })
    }

    const categories = {
        ai_providers: settings.filter(s => s.id.includes('provider') || s.id.includes('model')),
        ai_instructions: settings.filter(s => s.id.includes('instructions')),
        api_keys: settings.filter(s => s.is_secret)
    }

    const SettingRow = ({ item }: { item: AppSetting }) => {
        const isEditing = true // Simple direct edit approach
        const isSecret = item.is_secret
        const isVisible = showSecrets[item.id]

        return (
            <div className="p-6 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                {item.id}
                            </span>
                            {isSecret && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1">{item.description}</p>
                    </div>

                    <div className="flex-1 max-w-xl w-full">
                        <div className="relative group">
                            {item.id === 'ai_system_instructions' ? (
                                <textarea
                                    className="w-full text-sm font-mono border border-gray-200 rounded-lg p-3 min-h-[160px] focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                                    value={item.value}
                                    onChange={(e) => {
                                        const newValue = e.target.value
                                        setSettings(prev => prev.map(s => s.id === item.id ? { ...s, value: newValue } : s))
                                    }}
                                    onBlur={(e) => handleUpdate(item.id, e.target.value)}
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type={isSecret && !isVisible ? 'password' : 'text'}
                                        className={`flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm ${isSecret ? 'pr-10' : ''}`}
                                        value={item.value}
                                        onChange={(e) => {
                                            const newValue = e.target.value
                                            setSettings(prev => prev.map(s => s.id === item.id ? { ...s, value: newValue } : s))
                                        }}
                                        onBlur={(e) => handleUpdate(item.id, e.target.value)}
                                    />
                                    {isSecret && (
                                        <button
                                            type="button"
                                            onClick={() => setShowSecrets(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                            className="p-2 text-gray-400 hover:text-indigo-600 transition"
                                        >
                                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400 font-medium uppercase tracking-widest flex items-center gap-1">
                            <Save className={`w-3 h-3 ${isPending ? 'animate-pulse text-indigo-500' : 'text-gray-300'}`} />
                            {isPending ? 'Syncing with secure vault...' : 'Auto-saves on blur'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* AI Core Config */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-900">AI Intelligence Core</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {categories.ai_providers.map(s => <SettingRow key={s.id} item={s} />)}
                </div>
            </div>

            {/* AI Persona/Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-900">AI Personality & Behaviors</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {categories.ai_instructions.map(s => <SettingRow key={s.id} item={s} />)}
                </div>
            </div>

            {/* API Secure Vault */}
            <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-amber-900">Secure API Credentials</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {categories.api_keys.map(s => <SettingRow key={s.id} item={s} />)}
                </div>
            </div>

            <div className="text-center pb-8">
                <p className="text-xs text-gray-400">
                    Security Tip: Changes to API keys take effect immediately on the next AI generation request.
                </p>
            </div>
        </div>
    )
}
