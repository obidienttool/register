'use client'

import { useState } from 'react'
import { Download, Users, HelpCircle, Baby } from 'lucide-react'

type Member = {
    id: string
    full_name: string
    email: string
    phone: string
    created_at: string
    age: number
    states: { name: string } | null
    lgas: { name: string } | null
    registered_polling_unit: { name: string; code: string | null } | null
    intended_polling_unit: { name: string; code: string | null } | null
}

export default function UnregisteredMembersClient({
    unregistered,
    helpRequested,
    under18
}: {
    unregistered: Member[],
    helpRequested: Member[],
    under18: Member[]
}) {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C'>('A')

    const tabs = [
        { id: 'A', name: 'Not Registered', count: unregistered.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'B', name: 'Requesting Help', count: helpRequested.length, icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'C', name: 'Under 18', count: under18.length, icon: Baby, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]

    const getActiveData = () => {
        if (activeTab === 'A') return unregistered
        if (activeTab === 'B') return helpRequested
        return under18
    }

    const exportToCSV = () => {
        const data = getActiveData()
        const headers = ["Name", "Email", "Phone", "Age", "State", "LGA", "Status", "Polling Unit", "Date Joined"]
        const csvContent = [
            headers.join(","),
            ...data.map(m => {
                const pu = m.registered_polling_unit || m.intended_polling_unit
                const status = m.registered_polling_unit ? "Registered" : "Intended"
                return [
                    `"${m.full_name}"`,
                    `"${m.email}"`,
                    `"${m.phone}"`,
                    m.age,
                    `"${m.states?.name || ''}"`,
                    `"${m.lgas?.name || ''}"`,
                    `"${status}"`,
                    `"${pu ? (pu.code ? pu.code + ' - ' : '') + pu.name : ''}"`,
                    new Date(m.created_at).toLocaleDateString()
                ].join(",")
            })
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `obidient_members_category_${activeTab}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const data = getActiveData()

    return (
        <div className="space-y-6 font-inter">
            {/* Tabs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all ${activeTab === tab.id
                            ? 'border-transparent ring-2 ring-green-500 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${tab.bg}`}>
                                <tab.icon className={`h-5 w-5 ${tab.color}`} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tab.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-900">
                        {tabs.find(t => t.id === activeTab)?.name} List
                    </h3>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center space-x-2 text-sm font-medium text-green-600 hover:text-green-700 transition"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">State/LGA</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Polling Unit Info</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {data.length > 0 ? (
                                data.map((member) => {
                                    const pu = member.registered_polling_unit || member.intended_polling_unit
                                    const isRegistered = !!member.registered_polling_unit

                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{member.full_name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{member.email}</div>
                                                <div className="text-xs text-gray-500 font-mono">{member.phone}</div>
                                                <div className="text-xs text-gray-500 mt-1">Age: {member.age}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{member.states?.name}</div>
                                                <div className="text-xs text-gray-500">{member.lgas?.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full w-fit mb-1 ${isRegistered ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        {isRegistered ? 'Registered Site' : 'Intended Site'}
                                                    </span>
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                                        {pu?.name || '---'}
                                                    </div>
                                                    {pu?.code && (
                                                        <div className="text-xs font-mono text-gray-500">{pu.code}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(member.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        No members found in this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
