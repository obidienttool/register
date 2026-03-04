'use client'

import { useState, useEffect, useTransition } from 'react'
import { getStates, getLgas, getWards, getPollingUnits } from '@/app/actions/locations'
import { getBroadcastAudienceCount, broadcastSMSAction } from '@/app/actions/sms'
import { ROLES } from '@/utils/rbac'
import { Send, ShieldAlert, BadgeInfo, CheckCircle } from 'lucide-react'

type LocationOptions = { id: number; name: string }[]

export default function SMSBroadcastClient() {
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
        if (message.length === 0 || message.length > 160) {
            setActionError('Invalid message length. Must be between 1 and 160 characters.')
            return
        }

        if (!confirm(`You are about to send this SMS to ${audienceCount} verified phones. Are you absolutely sure?`)) return

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

            const res = await broadcastSMSAction(filters, message)
            if (!res?.success) {
                setActionError(res?.error || 'Broadcast failed strictly.')
            } else {
                setActionSuccess(`Successfully queued ${res.recipientsCount} messages for delivery.`)
                setMessage('')
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex items-start">
                <BadgeInfo className="w-5 h-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Broadcast Rules Engine</p>
                    <p>You can send a maximum of 3 broadast campaigns per hour. Your recipients are firmly localized directly to your assigned region scope. Overly large queries will be rate-limited.</p>
                </div>
            </div>

            {actionError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-center shadow-sm">
                    <ShieldAlert className="h-6 w-6 text-red-500 mr-2 shrink-0" />
                    <p className="text-red-700 font-medium text-sm">{actionError}</p>
                </div>
            )}

            {actionSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 flex items-center shadow-sm">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2 shrink-0" />
                    <p className="text-green-800 font-medium text-sm">{actionSuccess}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Filtration Controls */}
                <div className="lg:col-span-1 space-y-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Audience Target</h3>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">State</label>
                        <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                            <option value="">All States</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">LGA</label>
                        <select value={filterLga} onChange={(e) => setFilterLga(e.target.value)} disabled={!filterState} className="mt-1 w-full disabled:bg-gray-100 rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                            <option value="">All LGAs</option>
                            {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Ward</label>
                        <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)} disabled={!filterLga} className="mt-1 w-full disabled:bg-gray-100 rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                            <option value="">All Wards</option>
                            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Polling Unit</label>
                        <select value={filterPu} onChange={(e) => setFilterPu(e.target.value)} disabled={!filterWard} className="mt-1 w-full disabled:bg-gray-100 rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                            <option value="">All Polling Units</option>
                            {pollingUnits.map(pu => <option key={pu.id} value={pu.id}>{pu.code ? `${pu.code} - ` : ''}{pu.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Role</label>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                            <option value="">All Roles</option>
                            {Object.values(ROLES).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase">Verified</label>
                            <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                                <option value="">All</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase">PU Team</label>
                            <select value={filterPuTeam} onChange={(e) => setFilterPuTeam(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-green-500">
                                <option value="">All</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-1">Estimated Recipients:</p>
                        <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            {calculating ? (
                                <span className="text-gray-400 text-lg">Calculating...</span>
                            ) : (
                                <span>{audienceCount.toLocaleString()} {audienceCount === 0 && <span className="text-red-500 text-sm ml-2 font-normal">(Zero reachable users)</span>}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* SMS Composition */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex-1">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 font-mono tracking-tight">
                            <Send className="w-5 h-5 text-gray-400" /> Compose Broadcast
                        </h3>
                        <textarea
                            disabled={isPending}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-48 rounded-md border border-gray-300 py-3 px-4 focus:ring-green-500 resize-none font-mono text-gray-800 disabled:opacity-50"
                            placeholder="Type your message here..."
                        ></textarea>
                        <div className="flex justify-between items-center mt-2">
                            <span className={`text-xs font-bold ${message.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                                {message.length} / 160 chars LIMIT
                            </span>
                            {message.length > 160 && (
                                <span className="text-xs text-red-600">Message too long! Must be max 160 characters.</span>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-b-lg border-t border-gray-100">
                        <button
                            onClick={handleSend}
                            disabled={isPending || calculating || audienceCount === 0 || message.length === 0 || message.length > 160}
                            className={`w-full py-3 rounded-md font-bold text-white shadow-sm flex justify-center items-center transition ${isPending || calculating || audienceCount === 0 || message.length === 0 || message.length > 160 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isPending ? 'Queuing Broadcast...' : 'Execute Broadcast Payload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
