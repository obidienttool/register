'use client'

import { useState } from 'react'
import { Users, Search, ChevronRight, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export default function AdminPollingUnitsClient({ initialUnits }: { initialUnits: any[] }) {
    const [search, setSearch] = useState('')

    const filtered = initialUnits.filter(pu =>
        pu.name.toLowerCase().includes(search.toLowerCase()) ||
        (pu.code && pu.code.includes(search)) ||
        pu.ward?.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Polling Units, Codes or Wards..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((pu) => (
                        <Link
                            key={pu.id}
                            href={`/admin/polling-units/${pu.id}/team`}
                            className="group border border-gray-100 rounded-lg p-4 hover:border-green-300 hover:bg-green-50/50 transition flex flex-col justify-between shadow-sm hover:shadow-md h-40"
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest truncate max-w-[120px]">
                                        {pu.ward?.lga?.name || 'Unknown LGA'}
                                    </span>
                                    <div className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition flex items-center gap-1 ${pu.team_count >= 5 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        <Users className="w-3 h-3" /> {pu.team_count} / 5
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition line-clamp-2 leading-tight">
                                    {pu.code ? `${pu.code} - ` : ''}{pu.name}
                                </h3>
                                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-tighter truncate">
                                    Ward: {pu.ward?.name}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-gray-400 group-hover:text-green-600 transition">
                                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                                    Manage Team
                                </span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400">
                            <LayoutGrid className="w-12 h-12 mb-2 opacity-20" />
                            <p>No polling units found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
