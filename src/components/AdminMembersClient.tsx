'use client'

import { useState, useEffect, useTransition } from 'react'
import { getStates, getLgas, getWards, getPollingUnits } from '@/app/actions/locations'
import { getScopedMembers, verifyMemberAction, promoteMemberAction, exportMembersAction } from '@/app/actions/members'
import { ROLES } from '../utils/rbac'
import { Check, ShieldAlert, BadgeInfo, Download } from 'lucide-react'

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

    // Fetch whenever filters change
    useEffect(() => {
        fetchMembers()
    }, [filterState, filterLga, filterWard, filterPu, filterRole, filterVerified, filterPuTeam])

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
            }
            const data = await getScopedMembers(filters)
            setMembers(data || [])
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
            {actionError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                        <ShieldAlert className="h-6 w-6 text-red-500 mr-2" />
                        <p className="text-red-700">{actionError}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by State</label>
                    <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All States</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by LGA</label>
                    <select value={filterLga} onChange={(e) => setFilterLga(e.target.value)} disabled={!filterState} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All LGAs</option>
                        {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Ward</label>
                    <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)} disabled={!filterLga} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All Wards</option>
                        {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by PU</label>
                    <select value={filterPu} onChange={(e) => setFilterPu(e.target.value)} disabled={!filterWard} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All Polling Units</option>
                        {pollingUnits.map(pu => <option key={pu.id} value={pu.id}>{pu.code ? `${pu.code} - ` : ''}{pu.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All Roles</option>
                        {Object.values(ROLES).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verified Status</label>
                    <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All</option>
                        <option value="yes">Verified Only</option>
                        <option value="no">Unverified Only</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PU Team Member</label>
                    <select value={filterPuTeam} onChange={(e) => setFilterPuTeam(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500">
                        <option value="">All</option>
                        <option value="yes">Yes (Assigned)</option>
                        <option value="no">No (Unassigned)</option>
                    </select>
                </div>
                <div className="flex flex-col justify-end">
                    <div className="flex gap-2 w-full">
                        <button
                            disabled={exporting || loadingMembers}
                            onClick={() => handleExport('csv')}
                            className="bg-gray-800 text-white flex-1 hover:bg-gray-900 px-3 py-2 rounded-md font-medium text-sm flex items-center justify-center transition disabled:opacity-50"
                        >
                            <Download className="w-4 h-4 mr-1" /> CSV
                        </button>
                        <button
                            disabled={exporting || loadingMembers}
                            onClick={() => handleExport('xlsx')}
                            className="bg-green-600 text-white flex-1 hover:bg-green-700 px-3 py-2 rounded-md font-medium text-sm flex items-center justify-center transition disabled:opacity-50"
                        >
                            <Download className="w-4 h-4 mr-1" /> Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                    {loadingMembers ? (
                        <div className="text-center py-10">Loading members...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {members.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No members found</td></tr>
                                ) : (
                                    members.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                                                <div className="text-sm text-gray-500">{member.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-700">{member.state?.name} - {member.lga?.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-1">
                                                    <span className="uppercase bg-gray-100 inline-block px-2 py-0.5 rounded">{member.ward?.name} • {member.polling_unit?.code || member.polling_unit?.name}</span>
                                                    {member.polling_unit && (callerRole === 'ADMIN' || callerRole === 'WARD_COORDINATOR') && (
                                                        <a href={`/admin/polling-units/${member.polling_unit_id}/team`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                                            (Manage Team)
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : member.role.includes('COORDINATOR') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {member.role.replace('_', ' ')}
                                                    </span>
                                                    {member.verified ? (
                                                        <div className="text-xs mt-1 text-green-600 flex items-center font-bold">
                                                            <Check className="w-3 h-3 mr-1" /> {member.membership_number}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs mt-1 text-yellow-600">Unverified</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium flex gap-3 h-full items-center">
                                                {!member.verified && (callerRole === 'ADMIN' || callerRole === 'WARD_COORDINATOR') && (
                                                    <button
                                                        onClick={() => handleVerify(member.id)}
                                                        disabled={isPending}
                                                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded disabled:opacity-50 transition"
                                                    >
                                                        Verify
                                                    </button>
                                                )}

                                                {member.verified && callerRole === 'ADMIN' && promotingUserId !== member.id && (
                                                    <button
                                                        onClick={() => setPromotingUserId(member.id)}
                                                        className="text-blue-600 border border-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition"
                                                    >
                                                        Promote
                                                    </button>
                                                )}

                                                {promotingUserId === member.id && (
                                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                                                        <select
                                                            value={newRole}
                                                            onChange={(e) => setNewRole(e.target.value)}
                                                            className="border rounded px-2 py-1 text-xs"
                                                        >
                                                            <option value="">Select Role...</option>
                                                            {Object.values(ROLES).filter(r => r !== 'MEMBER').map((r: string) => (
                                                                <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                                            ))}
                                                        </select>
                                                        <button onClick={() => handlePromote(member.id)} disabled={isPending || !newRole} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Confirm</button>
                                                        <button onClick={() => setPromotingUserId(null)} className="text-gray-500 text-xs hover:underline">Cancel</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
