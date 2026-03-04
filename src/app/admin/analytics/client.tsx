'use client'

import { useEffect, useState } from 'react'
import { getAnalyticsSummary } from '@/app/actions/analytics'
import { getSmsLogs } from '@/app/actions/sms'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, ShieldCheck, UserCheck, LayoutDashboard, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsClient() {
    const [stats, setStats] = useState<any>(null)
    const [smsLogs, setSmsLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            getAnalyticsSummary(),
            getSmsLogs(5)
        ]).then(([data, logs]) => {
            setStats(data)
            setSmsLogs(logs || [])
            setLoading(false)
        }).catch(console.error)
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading Analytics...</p>
            </div>
        )
    }

    if (!stats) {
        return <div className="text-red-500 font-bold p-10 text-center">Failed to load analytics or unauthorized.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutDashboard className="text-green-600" /> Analytics Dashboard
                </h1>
                <Link href="/admin/members" className="text-sm border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium transition shadow-sm">
                    Back to Members
                </Link>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between border-l-4 border-blue-500">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Members</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalMembers.toLocaleString()}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-200" />
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between border-l-4 border-green-500">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Verified</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalVerified.toLocaleString()}</p>
                    </div>
                    <ShieldCheck className="w-10 h-10 text-green-200" />
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between border-l-4 border-purple-500">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">PU Team Assigned</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPuMembers.toLocaleString()}</p>
                    </div>
                    <UserCheck className="w-10 h-10 text-purple-200" />
                </div>
            </div>

            {/* Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {stats.membersByState.length > 0 && (
                    <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Members by State</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.membersByState}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {stats.membersByLga.length > 0 && (
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg flex flex-col h-full">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Top Local Governments</h3>
                        </div>
                        <div className="overflow-y-auto max-h-[300px] p-0 flex-1">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LGA Name</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {stats.membersByLga.slice(0, 15).map((lga: any) => (
                                        <tr key={lga.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-700 font-medium">{lga.name}</td>
                                            <td className="px-6 py-3 text-sm text-gray-900 font-bold text-right">{lga.count.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* SMS Logs Area */}
            {smsLogs.length > 0 && (
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg mt-8">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-gray-400" /> Recent SMS Broadcasts
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message Snippet</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recipients</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {smsLogs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{log.sender?.full_name}</p>
                                            <p className="text-xs text-gray-500">{log.sender?.role}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate" title={log.message}>
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">
                                            {log.total_recipients.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
