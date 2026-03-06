'use client'

import { useState, useEffect, useTransition } from 'react'
import { getStates, getLgas, getWards, getPollingUnits } from '@/app/actions/locations'
import { getScopedMembers, verifyMemberAction, promoteMemberAction, exportMembersAction } from '@/app/actions/members'
import { ROLES } from '../utils/rbac'
import { Check, ShieldAlert, BadgeInfo, Download, Settings, ChevronRight, MapPin, CheckCircle, Users } from 'lucide-react'

type LocationOptions = { id: number; name: string }[]

export default function AdminMembersClient({ callerRole }: { callerRole: string }) {
    const [members, setMembers] = useState<any[]>([])
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
    const [searchQuery, setSearchQuery] = useState<string>('')

    const [isPending, startTransition] = useTransition()
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    // Promotion State
    const [promotingUserId, setPromotingUserId] = useState<string | null>(null)
    const [newRole, setNewRole] = useState<string>('')

    useEffect(() => {
        getStates().then(setStates).catch(console.error)
        fetchMembers()
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

    // Fetch whenever filters or search change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMembers()
        }, 500)
        return () => clearTimeout(timer)
    }, [filterState, filterLga, filterWard, filterPu, filterRole, filterVerified, filterPuTeam, searchQuery])

    const fetchMembers = async () => {
        setLoadingMembers(true)
        try {
            const filters = {
                ...(filterState ? { stateId: parseInt(filterState) } : {}),
                ...(filterLga ? { lgaId: parseInt(filterLga) } : {}),
                ...(filterWard ? { wardId: parseInt(filterWard) } : {}),
                ...(filterPu ? { puId: parseInt(filterPu) } : {}),
                ...(filterRole ? { role: filterRole } : {}),
                ...(filterVerified ? { verified: filterVerified } : {}),
                ...(filterPuTeam ? { puTeamMember: filterPuTeam } : {}),
                ...(searchQuery ? { search: searchQuery } : {}),
            }
            const res = await getScopedMembers(filters)
            if (res && 'error' in res && res.error) {
                setActionError(`Query Error: ${res.error}`)
                setMembers([])
            } else {
                setMembers((res as any).data || [])
            }
        } catch (e: any) {
            console.error(e)
            setActionError(`Fetch Error: ${e.message}`)
        } finally {
            setLoadingMembers(false)
        }
    }

    const handleExport = async (format: 'csv' | 'xlsx') => {
        setExporting(true)
        try {
            const filters = {
                ...(filterState ? { stateId: parseInt(filterState) } : {}),
                ...(filterLga ? { lgaId: parseInt(filterLga) } : {}),
                ...(filterWard ? { wardId: parseInt(filterWard) } : {}),
                ...(filterPu ? { puId: parseInt(filterPu) } : {}),
                ...(filterRole ? { role: filterRole } : {}),
                ...(filterVerified ? { verified: filterVerified } : {}),
                ...(filterPuTeam ? { puTeamMember: filterPuTeam } : {}),
                ...(searchQuery ? { search: searchQuery } : {}),
            }
            const res = await exportMembersAction(filters, format)
            if (res.success && res.fileData) {
                const byteCharacters = atob(res.fileData)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: res.mimeType })

                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = res.fileName || `export.${format}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } else {
                alert(res.error || 'Export failed')
            }
        } catch (e) {
            console.error(e)
            alert('Export encountered an error.')
        } finally {
            setExporting(false)
        }
    }

    const handleVerify = async (userId: string) => {
        if (!confirm('Are you sure you want to verify this member? This will generate a unique membership number.')) return

        startTransition(async () => {
            setActionError(null)
            const res = await verifyMemberAction(userId)
            if (!res?.success) {
                setActionError(res?.error || 'Verification failed')
            } else {
                alert(`Verified! New Membership Number: ${res.membershipNumber}`)
                fetchMembers()
            }
        })
    }

    const handlePromote = async (userId: string) => {
        if (!newRole) {
            alert("Please select a role to promote to");
            return;
        }
        if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) return

        startTransition(async () => {
            setActionError(null)
            const res = await promoteMemberAction(userId, newRole)
            if (!res?.success) {
                setActionError(res?.error || 'Promotion failed')
            } else {
                alert(`User successfully promoted to ${newRole}`)
                setPromotingUserId(null)
                setNewRole('')
                fetchMembers()
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Responsive Filters - Mobile First */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex-1 relative group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute left-3 -top-2 bg-white px-1">Search Directory</label>
                        <input
                            type="text"
                            placeholder="Name, Phone, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 py-3 pl-3 pr-10 text-sm focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
                        />
                        <div className="absolute right-3 top-3.5 text-slate-400">
                            <BadgeInfo className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            disabled={exporting || loadingMembers}
                            onClick={() => handleExport('xlsx')}
                            className="flex-1 md:flex-none bg-green-600 text-white hover:bg-green-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition shadow-md shadow-green-200"
                        >
                            <Download className="w-4 h-4 mr-2" /> Export
                        </button>
                    </div>
                </div>

                <details className="group">
                    <summary className="list-none flex items-center justify-between cursor-pointer text-xs font-bold text-slate-500 hover:text-green-600 transition">
                        <span className="flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" /> Advanced Filters
                        </span>
                        <ChevronRight className="w-4 h-4 group-open:rotate-90 transition" />
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">State</label>
                            <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-green-500 outline-none">
                                <option value="">All States</option>
                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">LGA</label>
                            <select value={filterLga} onChange={(e) => setFilterLga(e.target.value)} disabled={!filterState} className="w-full disabled:opacity-50 rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-green-500 outline-none">
                                <option value="">All LGAs</option>
                                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Ward</label>
                            <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)} disabled={!filterLga} className="w-full disabled:opacity-50 rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-green-500 outline-none">
                                <option value="">All Wards</option>
                                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Polling Unit</label>
                            <select value={filterPu} onChange={(e) => setFilterPu(e.target.value)} disabled={!filterWard} className="w-full disabled:opacity-50 rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-green-500 outline-none">
                                <option value="">All Polling Units</option>
                                {pollingUnits.map(pu => <option key={pu.id} value={pu.id}>{pu.code ? `${pu.code}-` : ''}{pu.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-green-500 outline-none">
                                <option value="">Any Role</option>
                                {Object.values(ROLES).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                            <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-green-500 outline-none">
                                <option value="">All Status</option>
                                <option value="yes">Verified</option>
                                <option value="no">Unverified</option>
                            </select>
                        </div>
                    </div>
                </details>
            </div>

            {/* List Results */}
            <div className="space-y-4">
                {loadingMembers ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500 font-bold text-sm">Querying database...</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View (shown only on small screens) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
                            {members.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm italic">No records match your criteria</div>
                            ) : (
                                members.map((member) => (
                                    <div key={member.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate">{member.full_name}</h4>
                                                <p className="text-xs text-slate-500">{member.phone}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-[9px] font-bold rounded-lg uppercase tracking-tight shrink-0 ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                member.role.includes('COORDINATOR') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="space-y-2 py-3 border-y border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                <div className="text-[11px] text-slate-600 truncate">
                                                    {member.ward?.name} • {member.polling_unit?.code || member.polling_unit?.name || 'No PU'}
                                                </div>
                                            </div>
                                            {member.verified ? (
                                                <div className="flex items-center gap-2 text-green-600 font-black text-[11px] tracking-widest">
                                                    <CheckCircle className="w-3.5 h-3.5" /> {member.membership_number}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600 font-bold text-[11px]">
                                                    <ShieldAlert className="w-3.5 h-3.5" /> NOT VERIFIED
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {!member.verified && (callerRole === 'ADMIN' || callerRole === 'WARD_COORDINATOR') && (
                                                <button
                                                    onClick={() => handleVerify(member.id)}
                                                    disabled={isPending}
                                                    className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm shadow-green-200 active:scale-95 transition"
                                                >
                                                    Verify Now
                                                </button>
                                            )}
                                            {member.verified && callerRole === 'ADMIN' && (
                                                <button
                                                    onClick={() => setPromotingUserId(member.id)}
                                                    className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs active:scale-95 transition"
                                                >
                                                    Manage Role
                                                </button>
                                            )}
                                            {(callerRole === 'ADMIN' || callerRole === 'WARD_COORDINATOR') && member.polling_unit && (
                                                <Link
                                                    href={`/admin/polling-units/${member.polling_unit_id}/team`}
                                                    className="p-2 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"
                                                >
                                                    <Users className="w-5 h-5" />
                                                </Link>
                                            )}
                                        </div>

                                        {promotingUserId === member.id && (
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Change Member Level</p>
                                                <select
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-blue-500"
                                                >
                                                    <option value="">Select Target Role...</option>
                                                    {Object.values(ROLES).filter(r => r !== 'MEMBER').map((r: string) => (
                                                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handlePromote(member.id)} disabled={isPending || !newRole} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-[10px]">Update Role</button>
                                                    <button onClick={() => setPromotingUserId(null)} className="px-4 text-slate-400 font-bold text-[10px]">Back</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View (shown from md up) */}
                        <div className="hidden md:block bg-white shadow overflow-hidden rounded-2xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Member Identity</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Location Branch</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Designation</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Management</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {members.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">No records found matching current scope</td></tr>
                                    ) : (
                                        members.map((member) => (
                                            <tr key={member.id} className="hover:bg-slate-50 transition duration-75">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900">{member.full_name}</div>
                                                    <div className="text-xs text-slate-500">{member.phone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[11px] font-bold text-slate-700">{member.state?.name} • {member.lga?.name}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{member.ward?.name} • {member.polling_unit?.code || member.polling_unit?.name || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className={`w-fit px-2.5 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-widest ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                            member.role.includes('COORDINATOR') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {member.role.replace('_', ' ')}
                                                        </span>
                                                        {member.verified ? (
                                                            <div className="text-[10px] text-green-600 flex items-center font-black tracking-widest italic uppercase">
                                                                <Check className="w-3 h-3 mr-1" /> {member.membership_number}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">Identity Pending</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {!member.verified && (callerRole === 'ADMIN' || callerRole === 'WARD_COORDINATOR') && (
                                                            <button
                                                                onClick={() => handleVerify(member.id)}
                                                                disabled={isPending}
                                                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition"
                                                            >
                                                                Verify
                                                            </button>
                                                        )}

                                                        {member.verified && callerRole === 'ADMIN' && promotingUserId !== member.id && (
                                                            <button
                                                                onClick={() => setPromotingUserId(member.id)}
                                                                className="text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-bold transition"
                                                            >
                                                                Promote
                                                            </button>
                                                        )}

                                                        {promotingUserId === member.id && (
                                                            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                                                <select
                                                                    value={newRole}
                                                                    onChange={(e) => setNewRole(e.target.value)}
                                                                    className="border-none bg-white rounded-lg px-2 py-1 text-[10px] focus:ring-0"
                                                                >
                                                                    <option value="">Role...</option>
                                                                    {Object.values(ROLES).filter(r => r !== 'MEMBER').map((r: string) => (
                                                                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                                                    ))}
                                                                </select>
                                                                <button onClick={() => handlePromote(member.id)} disabled={isPending || !newRole} className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase">Go</button>
                                                                <button onClick={() => setPromotingUserId(null)} className="text-slate-400 p-1 hover:text-slate-600"><BadgeInfo className="w-3 h-3 rotate-45" /></button>
                                                            </div>
                                                        )}

                                                        {member.polling_unit && (callerRole === 'ADMIN' || callerRole === 'WARD_COORDINATOR') && (
                                                            <Link
                                                                href={`/admin/polling-units/${member.polling_unit_id}/team`}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                                                                title="Manage PU Team"
                                                            >
                                                                <Users className="w-4 h-4" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
