'use client'

import { useState, useTransition } from 'react'
import { Check, Edit2, X, Shield, Phone, Mail, MapPin } from 'lucide-react'
import { ROLES } from '@/utils/rbac'
import { updateStaffAction } from '@/app/actions/members'
import { getStates, getLgas, getWards } from '@/app/actions/locations'

type StaffMember = {
    id: string
    full_name: string
    phone: string
    email: string | null
    role: string
    state_id: number | null
    lga_id: number | null
    ward_id: number | null
    state?: { name: string }
    lga?: { name: string }
    ward?: { name: string }
}

export default function StaffManagerClient({ initialStaff }: { initialStaff: any[] }) {
    const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<StaffMember>>({})
    const [states, setStates] = useState<{ id: number; name: string }[]>([])
    const [lgas, setLgas] = useState<{ id: number; name: string }[]>([])
    const [wards, setWards] = useState<{ id: number; name: string }[]>([])
    const [isPending, startTransition] = useTransition()

    const startEditing = async (member: StaffMember) => {
        setEditingId(member.id)
        setEditForm({
            role: member.role,
            state_id: member.state_id,
            lga_id: member.lga_id,
            ward_id: member.ward_id
        })

        // Pre-fetch locations
        try {
            const s = await getStates()
            setStates(s)
            if (member.state_id) {
                const l = await getLgas(member.state_id)
                setLgas(l)
            }
            if (member.lga_id) {
                const w = await getWards(member.lga_id)
                setWards(w)
            }
        } catch (e) {
            console.error("Location fetch error:", e)
        }
    }

    const handleStateChange = async (stateId: string) => {
        const id = stateId ? parseInt(stateId) : null
        setEditForm(prev => ({ ...prev, state_id: id, lga_id: null, ward_id: null }))
        if (id) {
            const l = await getLgas(id)
            setLgas(l)
        } else {
            setLgas([])
        }
        setWards([])
    }

    const handleLgaChange = async (lgaId: string) => {
        const id = lgaId ? parseInt(lgaId) : null
        setEditForm(prev => ({ ...prev, lga_id: id, ward_id: null }))
        if (id) {
            const w = await getWards(id)
            setWards(w)
        } else {
            setWards([])
        }
    }

    const saveEdit = async () => {
        if (!editingId) return

        startTransition(async () => {
            const res = await updateStaffAction(editingId, {
                role: editForm.role,
                stateId: editForm.state_id,
                lgaId: editForm.lga_id,
                wardId: editForm.ward_id
            })

            if (res.success) {
                // To avoid complex client-side name reconciliation, we alert and reset
                // In a real app, we'd trigger a router refresh or fetch fresh data
                alert('Staff updated successfully. Refreshing list...')
                window.location.reload()
            } else {
                alert(res.error || 'Failed to update staff')
            }
        })
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-indigo-900">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Staff Details</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Assigned Scope</th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {staff.map((member) => (
                            <tr key={member.id} className={editingId === member.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50 transition'}>
                                <td className="px-6 py-4 border-l-2 border-transparent hover:border-indigo-400">
                                    <div className="text-sm font-bold text-gray-900">{member.full_name}</div>
                                    <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-500">
                                        <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3" /> {member.phone}</span>
                                        {member.email && <span className="flex items-center gap-1 font-mono"><Mail className="w-3 h-3" /> {member.email}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === member.id ? (
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="text-xs border border-indigo-200 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        >
                                            {Object.values(ROLES).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <Shield className={`w-3.5 h-3.5 ${member.role === 'ADMIN' ? 'text-purple-500' : 'text-indigo-500'}`} />
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === member.id ? (
                                        <div className="flex flex-col gap-1.5 max-w-xs">
                                            <select
                                                value={editForm.state_id || ''}
                                                onChange={(e) => handleStateChange(e.target.value)}
                                                className="text-[11px] border border-gray-200 rounded px-2 py-1"
                                            >
                                                <option value="">Global (No State)</option>
                                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <select
                                                value={editForm.lga_id || ''}
                                                onChange={(e) => handleLgaChange(e.target.value)}
                                                disabled={!editForm.state_id}
                                                className="text-[11px] border border-gray-200 rounded px-2 py-1 disabled:bg-gray-50 disabled:text-gray-400"
                                            >
                                                <option value="">All LGAs in State</option>
                                                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                            <select
                                                value={editForm.ward_id || ''}
                                                onChange={(e) => setEditForm({ ...editForm, ward_id: e.target.value ? parseInt(e.target.value) : null })}
                                                disabled={!editForm.lga_id}
                                                className="text-[11px] border border-gray-200 rounded px-2 py-1 disabled:bg-gray-50 disabled:text-gray-400"
                                            >
                                                <option value="">All Wards in LGA</option>
                                                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 flex flex-col gap-0.5 italic">
                                            {member.state_id ? (
                                                <>
                                                    <span className="flex items-center gap-1 font-medium not-italic text-gray-800">
                                                        <MapPin className="w-3 h-3 text-indigo-500" /> {member.state?.name}
                                                    </span>
                                                    {member.lga?.name && <span className="pl-4 border-l ml-1.5 border-gray-200 text-gray-500 text-[10px]">{member.lga.name}</span>}
                                                    {member.ward?.name && <span className="pl-4 border-l ml-1.5 border-gray-200 text-gray-400 text-[10px]">{member.ward.name}</span>}
                                                </>
                                            ) : (
                                                <span className="text-gray-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Global Authority</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingId === member.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={saveEdit}
                                                disabled={isPending}
                                                className="p-1.5 bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                                                title="Save Changes"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 bg-white text-gray-400 border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition"
                                                title="Cancel"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEditing(member)}
                                            className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition"
                                            title="Edit Staff Permissions"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No administrative staff found. Only users with roles (Admin, Coordinator, etc.) appear here.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
