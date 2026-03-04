'use client'

import { useState, useTransition } from 'react'
import {
    toggleSettingAction,
    generateBackupAction,
    restoreBackupAction,
    addSystemVersionAction
} from '@/app/actions/settings'
import {
    ShieldCheck,
    Database,
    UploadCloud,
    Power,
    History,
    AlertTriangle,
    CheckCircle,
    ServerCrash,
    Settings,
    Tag,
    Lock
} from 'lucide-react'

export default function AdminSettingsClient({
    settings,
    stats,
    coordinators,
    backups,
    updates
}: {
    settings: any[],
    stats: any,
    coordinators: any[],
    backups: any[],
    updates: any[]
}) {
    const [isPending, startTransition] = useTransition()
    const [actionMessage, setActionMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

    // Forms state
    const [restoreId, setRestoreId] = useState<string>('')
    const [confirmText, setConfirmText] = useState('')
    const [versionTag, setVersionTag] = useState('')
    const [versionDesc, setVersionDesc] = useState('')

    const handleToggle = (key: string, value: boolean) => {
        if (!confirm(`Are you sure you want to toggle ${key}?`)) return
        setActionMessage(null)
        startTransition(async () => {
            const res = await toggleSettingAction(key, value)
            if (!res?.success) setActionMessage({ type: 'error', text: res?.error || 'Failed to toggle setting' })
            else setActionMessage({ type: 'success', text: `${key} successfully updated.` })
        })
    }

    const handleGenerateBackup = () => {
        if (!confirm('This process may freeze the database momentarily. Proceed to create a JSON snapshot?')) return
        setActionMessage(null)
        startTransition(async () => {
            const res = await generateBackupAction()
            if (!res?.success) setActionMessage({ type: 'error', text: res?.error || 'Backup generation failed.' })
            else setActionMessage({ type: 'success', text: 'Backup snapshot secured natively.' })
        })
    }

    const handleRestore = () => {
        setActionMessage(null)
        if (!restoreId) {
            setActionMessage({ type: 'error', text: 'Select a backup hash point.' })
            return
        }
        if (confirmText !== 'RESTORE_NOW') {
            setActionMessage({ type: 'error', text: 'Must type strictly RESTORE_NOW to execute injection.' })
            return
        }

        startTransition(async () => {
            const res = await restoreBackupAction(restoreId, confirmText)
            if (!res?.success) setActionMessage({ type: 'error', text: res?.error || 'Restore execution halted.' })
            else {
                setActionMessage({ type: 'success', text: res?.message || 'Restore executed.' })
                setRestoreId('')
                setConfirmText('')
            }
        })
    }

    const handleAddVersion = () => {
        setActionMessage(null)
        if (!versionTag || !versionDesc) {
            setActionMessage({ type: 'error', text: 'Version tag and description are required.' })
            return
        }
        startTransition(async () => {
            const res = await addSystemVersionAction(versionTag, versionDesc)
            if (!res?.success) setActionMessage({ type: 'error', text: res?.error || 'Failed to push version patch.' })
            else {
                setActionMessage({ type: 'success', text: `Successfully registered version ${versionTag}.` })
                setVersionTag('')
                setVersionDesc('')
            }
        })
    }

    // Helper functions
    const getSettingVal = (k: string) => settings.find(s => s.key === k)?.value

    return (
        <div className="space-y-6">
            {/* Feedback Ribbon */}
            {actionMessage && (
                <div className={`p-4 rounded-md mb-4 flex items-center shadow-sm border ${actionMessage.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-800'}`}>
                    {actionMessage.type === 'error' ? <AlertTriangle className="h-5 w-5 mr-3" /> : <CheckCircle className="h-5 w-5 mr-3" />}
                    <p className="font-medium text-sm">{actionMessage.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Toggles & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Database Health Metrics */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-purple-600" /> Infrastructure Node
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">DB Overhead:</span>
                                <span className="font-mono font-medium">{stats.approxDbSize}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Users Provisioned:</span>
                                <span className="font-bold text-gray-900">{stats.usersCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Secure Verifications:</span>
                                <span className="font-bold text-gray-900">{stats.verifiedCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">PU Team Allocations:</span>
                                <span className="font-bold text-gray-900">{stats.teamCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">SMS Emitted:</span>
                                <span className="font-bold text-gray-900">{stats.smsCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Master Toggles */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <Power className="w-5 h-5 text-red-500" /> Primary Overrides
                        </h3>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">SMS Broadcasting</p>
                                    <p className="text-xs text-gray-500">Permit API delivery pings.</p>
                                </div>
                                <button
                                    disabled={isPending}
                                    onClick={() => handleToggle('sms_enabled', getSettingVal('sms_enabled'))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getSettingVal('sms_enabled') ? 'bg-green-600' : 'bg-gray-300'} disabled:opacity-50`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${getSettingVal('sms_enabled') ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Signups Available</p>
                                    <p className="text-xs text-gray-500">Allow frontend registration.</p>
                                </div>
                                <button
                                    disabled={isPending}
                                    onClick={() => handleToggle('signup_enabled', getSettingVal('signup_enabled'))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getSettingVal('signup_enabled') ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-50`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${getSettingVal('signup_enabled') ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Roles, Backups, Updates */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Role Allocations */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-600" /> Active Coordinator Index
                            </h3>
                            <a href="/admin/members" className="text-xs text-blue-600 font-medium hover:underline">Manage &rarr;</a>
                        </div>
                        <div className="overflow-y-auto max-h-48 text-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {coordinators.map(c => (
                                        <tr key={c.id}>
                                            <td className="py-2 pr-3">{c.full_name}</td>
                                            <td className="py-2 px-3">
                                                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">{c.role.replace('_', ' ')}</span>
                                            </td>
                                            <td className="py-2 pl-3 text-right text-gray-500">
                                                {c.state?.name} {c.lga?.name && `- ${c.lga.name}`} {c.ward?.name && `- ${c.ward.name}`}
                                            </td>
                                        </tr>
                                    ))}
                                    {coordinators.length === 0 && <tr><td colSpan={3} className="py-2 text-gray-500">No active coordinators verified.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Snapshot Matrix */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-yellow-600" /> Snapshot Backup & Restore Engine
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={handleGenerateBackup}
                                disabled={isPending}
                                className="bg-gray-800 text-white hover:bg-black px-4 py-2 rounded font-medium flex-1 text-sm flex justify-center items-center transition disabled:opacity-50"
                            >
                                <UploadCloud className="w-4 h-4 mr-2" /> Dump Current DB JSON Snippet
                            </button>
                        </div>

                        <div className="bg-red-50 p-4 rounded border border-red-200">
                            <h4 className="font-bold text-red-800 mb-2 flex items-center gap-1 text-sm"><ServerCrash className="w-4 h-4" /> Critical Rollback Overwrite</h4>
                            <div className="flex flex-col md:flex-row gap-2">
                                <select value={restoreId} onChange={(e) => setRestoreId(e.target.value)} className="flex-1 rounded border-red-300 text-sm p-2 focus:ring-red-500 bg-white">
                                    <option value="">-- Target Hash Blob --</option>
                                    {backups.map(b => (
                                        <option key={b.id} value={b.id}>{new Date(b.created_at).toLocaleString()} (by {b.creator?.full_name})</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Type RESTORE_NOW"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="flex-1 rounded border-red-300 text-sm p-2 focus:ring-red-500"
                                />
                                <button
                                    disabled={!restoreId || confirmText !== 'RESTORE_NOW' || isPending}
                                    onClick={handleRestore}
                                    className="bg-red-600 text-white font-bold px-4 rounded text-sm disabled:opacity-50 transition hover:bg-red-700"
                                >
                                    FIRE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* App Patch Control */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-600" /> Version Control Patches
                        </h3>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="SemVer (v1.0.5)" value={versionTag} onChange={e => setVersionTag(e.target.value)} className="w-32 rounded border-gray-300 text-sm p-2 focus:ring-indigo-500 block" />
                            <input type="text" placeholder="Patch Release Notes..." value={versionDesc} onChange={e => setVersionDesc(e.target.value)} className="flex-1 rounded border-gray-300 text-sm p-2 focus:ring-indigo-500 block" />
                            <button onClick={handleAddVersion} disabled={isPending || !versionTag} className="bg-indigo-600 text-white px-4 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 transition">Inject</button>
                        </div>
                        <ul className="space-y-2 mt-4 text-sm text-gray-600">
                            {updates.map(u => (
                                <li key={u.id} className="flex justify-between items-center border-l-2 border-indigo-400 pl-3 py-1 bg-gray-50 rounded-r">
                                    <span className="font-mono text-gray-900 font-bold">{u.version_tag}</span>
                                    <span className="truncate flex-1 px-4 text-xs">{u.description}</span>
                                    <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
                                </li>
                            ))}
                            {updates.length === 0 && <li className="text-gray-400 italic">No patches explicitly recorded in ledger.</li>}
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    )
}
