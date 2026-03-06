'use client'

import React, { useState, useEffect } from 'react'
import { getScopedMembers } from '@/app/actions/members'
import { Search, MapPin, UserCircle } from 'lucide-react'

export default function DirectoryClient() {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchMembers = async () => {
        setLoading(true)
        const res = await getScopedMembers({ search: searchQuery })
        setMembers((res as any).data || [])
        setLoading(false)
    }

    useEffect(() => {
        const timer = setTimeout(fetchMembers, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    return (
        <div className="space-y-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Scanning Directory...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                    {members.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-slate-400">
                            <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold">No members found in your directory</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div key={member.id} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-200 flex items-center gap-4 hover:border-green-100 transition-colors">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
                                    {member.photo_url ? (
                                        <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-10 h-10 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate -mb-0.5">{member.full_name}</h4>
                                    <p className="text-[11px] text-slate-500 font-bold">{member.phone}</p>
                                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-black uppercase tracking-tight">
                                        <MapPin className="w-3 h-3 text-red-400" />
                                        <span className="truncate">{member.polling_unit?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
