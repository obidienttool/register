'use client'

import React, { useState } from 'react'
import { updateProfileAction } from '@/app/actions/profile'
import { User, Phone, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileClientProps {
    profile: {
        full_name: string
        phone: string
    }
}

export default function ProfileClient({ profile }: ProfileClientProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        const formData = new FormData(e.currentTarget)
        const result = await updateProfileAction(formData)

        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 1500)
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to update profile.' })
        }
        setIsLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="text-sm font-bold">{message.text}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    defaultValue={profile.full_name}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    defaultValue={profile.phone}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="e.g. 08012345678"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>SAVE CHANGES</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
