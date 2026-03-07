'use client'

import { useState, useEffect, useTransition } from 'react'
import { getStates, getLgas, getWards, getPollingUnits } from '@/app/actions/locations'
import { getBroadcastAudienceCount } from '@/app/actions/sms'
import { broadcastEmailAction } from '@/app/actions/email'
import { ROLES } from '@/utils/rbac'
import { Mail, ShieldAlert, BadgeInfo, CheckCircle, Send } from 'lucide-react'

type LocationOptions = { id: number; name: string }[]

export default function EmailBroadcastClient() {
    const [states, setStates] = useState<LocationOptions>([])
    const [lgas, setLgas] = useState<LocationOptions>([])
    const [wards, setWards] = useState<LocationOptions>([])
    const [pollingUnits, setPollingUnits] = useState<{ id: number; name: string; code: string }[]>([])

    const [filterState, setFilterState] = useState<string>('')
    const [filterLga, setFilterLga] = useState<string>('')
    const [filterWard, setFilterWard] = useState<string>('')
    const [filterPu, setFilterPu] = useState<string>('')
    const [filterRole, setFilterRole] = useState<string>('')
    const [filterVerified, setFilterVerified] = useState<string>('')
    const [filterPuTeam, setFilterPuTeam] = useState<string>('')

    const [subject, setSubject] = useState<string>('')
    const [message, setMessage] = useState<string>('')
    const [audienceCount, setAudienceCount] = useState<number>(0)
    const [calculating, setCalculating] = useState(false)

    const [isPending, startTransition] = useTransition()
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)

    useEffect(() => {
        getStates().then(setStates).catch(console.error)
    }, [])

    useEffect(() => {
        if (filterState) {
            getLgas(parseInt(filterState)).then(setLgas).catch(console.error)
            setFilterLga('')
            setFilterWard('')
            setFilterPu('')
            setWards([])
            setPollingUnits([])
        }
    }, [filterState])

    useEffect(() => {
        if (filterLga) {
            getWards(parseInt(filterLga)).then(setWards).catch(console.error)
            setFilterWard('')
            setFilterPu('')
            setPollingUnits([])
        }
    }, [filterLga])

    useEffect(() => {
        if (filterWard) {
            getPollingUnits(parseInt(filterWard)).then(setPollingUnits).catch(console.error)
            setFilterPu('')
        }
    }, [filterWard])

    // Fetch audience count whenever filters change
    useEffect(() => {
        let isActive = true
        setCalculating(true)
        const filters = {
            ...(filterState ? { stateId: parseInt(filterState) } : {}),
            ...(filterLga ? { lgaId: parseInt(filterLga) } : {}),
            ...(filterWard ? { wardId: parseInt(filterWard) } : {}),
            ...(filterPu ? { puId: parseInt(filterPu) } : {}),
            ...(filterRole ? { role: filterRole } : {}),
            ...(filterVerified ? { verified: filterVerified } : {}),
            ...(filterPuTeam ? { puTeamMember: filterPuTeam } : {}),
        }

        getBroadcastAudienceCount(filters).then(count => {
            if (isActive) {
                setAudienceCount(count)
                setCalculating(false)
            }
        }).catch(() => {
            if (isActive) setCalculating(false)
        })

        return () => { isActive = false }
    }, [filterState, filterLga, filterWard, filterPu, filterRole, filterVerified, filterPuTeam])

    const handleSend = async () => {
        setActionError(null)
        setActionSuccess(null)

        if (audienceCount === 0) {
            setActionError('Cannot send broadcast: no recipients matched.')
            return
        }
        if (!subject.trim()) {
            setActionError('Subject is required.')
            return
        }
        if (!message.trim()) {
            setActionError('Message content is required.')
            return
        }

        if (!confirm(`You are about to send this Email to ${audienceCount} members. Are you absolutely sure?`)) return

        startTransition(async () => {
            const filters = {
                ...(filterState ? { stateId: parseInt(filterState) } : {}),
                ...(filterLga ? { lgaId: parseInt(filterLga) } : {}),
                ...(filterWard ? { wardId: parseInt(filterWard) } : {}),
                ...(filterPu ? { puId: parseInt(filterPu) } : {}),
                ...(filterRole ? { role: filterRole } : {}),
                ...(filterVerified ? { verified: filterVerified } : {}),
                ...(filterPuTeam ? { puTeamMember: filterPuTeam } : {}),
            }

            const res = await broadcastEmailAction(filters, subject, message)
            if (!res?.success) {
                setActionError(res?.error || 'Broadcast failed.')
            } else {
                setActionSuccess(`Successfully queued ${res.recipientsCount} emails for delivery.`)
                setMessage('')
                setSubject('')
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start">
                <BadgeInfo className="w-5 h-5 text-green-600 mr-3 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                    <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Unlimited Email Engine</p>
                    <p className="font-medium text-xs">Emails are sent via Resend. There are no strict character limits, but keep your messages concise for better readability.</p>
                </div>
            </div>

            {actionError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-2">
                    <ShieldAlert className="h-5 w-5 text-red-500 mr-3 shrink-0" />
                    <p className="text-red-700 font-bold text-sm">{actionError}</p>
                </div>
            )}

            {actionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 shrink-0" />
                    <p className="text-emerald-800 font-bold text-sm">{actionSuccess}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Filtration Controls */}
                <div className="lg:col-span-1 space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Target Audience</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">State</label>
                            <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                <option value="">All States</option>
                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">LGA</label>
                            <select value={filterLga} onChange={(e) => setFilterLga(e.target.value)} disabled={!filterState} className="w-full disabled:opacity-50 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                <option value="">All LGAs</option>
                                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Ward</label>
                            <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)} disabled={!filterLga} className="w-full disabled:opacity-50 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                <option value="">All Wards</option>
                                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Polling Unit</label>
                            <select value={filterPu} onChange={(e) => setFilterPu(e.target.value)} disabled={!filterWard} className="w-full disabled:opacity-50 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                <option value="">All Polling Units</option>
                                {pollingUnits.map(pu => <option key={pu.id} value={pu.id}>{pu.code ? `${pu.code} - ` : ''}{pu.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Role</label>
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                <option value="">All Roles</option>
                                {Object.values(ROLES).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Verified</label>
                                <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                    <option value="">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">PU Team</label>
                                <select value={filterPuTeam} onChange={(e) => setFilterPuTeam(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all">
                                    <option value="">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Potential Recipients</p>
                        <div className="text-3xl font-black text-slate-900 flex items-baseline gap-2">
                            {calculating ? (
                                <span className="text-slate-300 animate-pulse">...</span>
                            ) : (
                                <>
                                    <span>{audienceCount.toLocaleString()}</span>
                                    {audienceCount === 0 && <span className="text-red-500 text-[10px] font-bold uppercase tracking-tight ml-1">No Reachable Emails</span>}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Email Composition */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 md:p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-xl">
                                    <Mail className="w-5 h-5 text-slate-600" />
                                </div>
                                Compose Email
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Subject</label>
                                    <input
                                        disabled={isPending}
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="e.g. Important Update for Our Ward"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Body Content</label>
                                    <textarea
                                        disabled={isPending}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full h-80 rounded-2xl border border-slate-100 bg-slate-50 py-4 px-6 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all resize-none placeholder:text-slate-300"
                                        placeholder="Type your message here... You can use basic HTML if needed."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={handleSend}
                                disabled={isPending || calculating || audienceCount === 0 || subject.trim().length === 0 || message.trim().length === 0}
                                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>QUEUEING BROADCAST...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>EXECUTE EMAIL BROADCAST</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
