'use client'

import { useState, useTransition } from 'react'
import { assignTeamMemberAction, removeTeamMemberAction } from '@/app/actions/teams'
import { PlusCircle, Trash2, ShieldAlert } from 'lucide-react'

type User = { id: string, full_name: string, phone: string, membership_number: string }
type TeamMember = { id: string, role_title: string, user: User }

export default function AdminTeamClient({
    puId,
    initialTeam,
    availableVerifiedMembers
}: {
    puId: number,
    initialTeam: TeamMember[],
    availableVerifiedMembers: User[]
}) {
    const [selectedUserId, setSelectedUserId] = useState('')
    const [roleTitle, setRoleTitle] = useState('')
    const [isPending, startTransition] = useTransition()
    const [actionError, setActionError] = useState<string | null>(null)

    // Unassigned eligible members
    const unassignedMembers = availableVerifiedMembers.filter(m => !initialTeam.some(t => t.user.id === m.id))

    const handleAssign = () => {
        if (!selectedUserId || !roleTitle) {
            setActionError('Select user and role strictly.')
            return
        }

        startTransition(async () => {
            setActionError(null)
            const res = await assignTeamMemberAction(selectedUserId, puId, roleTitle)
            if (!res.success) {
                setActionError(res.error || 'Failed to assign team member.')
            } else {
                setSelectedUserId('')
                setRoleTitle('')
            }
        })
    }

    const handleRemove = (userId: string) => {
        if (!confirm('Remove member from team?')) return

        startTransition(async () => {
            setActionError(null)
            const res = await removeTeamMemberAction(userId, puId)
            if (!res.success) {
                setActionError(res.error || 'Failed to remove member.')
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

            {/* Assignment Form */}
            {initialTeam.length < 5 ? (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <PlusCircle className="text-green-600" /> Assign New Team Member
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Verified Member</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500 bg-white"
                            >
                                <option value="">-- Choose Member --</option>
                                {unassignedMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name} ({m.membership_number})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role Title</label>
                            <input
                                type="text"
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                placeholder="e.g. PU Leader, Observer"
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAssign}
                        disabled={isPending || !selectedUserId || !roleTitle}
                        className="w-full md:w-auto px-6 py-2 bg-green-600 text-white font-medium text-sm rounded hover:bg-green-700 transition disabled:opacity-50"
                    >
                        Assign to Team
                    </button>
                </div>
            ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 font-medium">Team Full</p>
                    <p className="text-yellow-600 text-sm">You have reached the maximum 5 members for this polling unit. Remove someone before re-assigning.</p>
                </div>
            )}

            {/* Team List */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {initialTeam.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No members currently assigned to team.</td></tr>
                        ) : initialTeam.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-l-4 border-green-500">
                                    {member.role_title}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{member.user.full_name}</div>
                                    <div className="text-xs text-gray-500">{member.user.membership_number}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleRemove(member.user.id)}
                                        disabled={isPending}
                                        className="flex items-center text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded transition disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
