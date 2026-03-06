import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
    MapPin, Shield, CheckCircle,
    Users, Newspaper, ExternalLink,
    ChevronRight, ArrowRight, Settings, Info, LayoutGrid, UserCircle
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/login')
    }

    // 1. Fetch Basic Profile
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`*`)
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-red-600 font-bold mb-2">Error loading profile</p>
                <p className="text-sm text-gray-600 mb-4">{profileError ? profileError.message : 'Profile record not found.'}</p>
                <div className="text-sm text-gray-500 italic">Please try logging in again.</div>
            </div>
        )
    }

    // 2. Fetch specialized data and settings separately to avoid ambiguous join errors
    const [stateRes, lgaRes, wardRes, puRes, teamRes, settingsRes] = await Promise.all([
        profile.state_id ? supabase.from('states').select('name').eq('id', profile.state_id).single() : { data: null },
        profile.lga_id ? supabase.from('lgas').select('name').eq('id', profile.lga_id).single() : { data: null },
        profile.ward_id ? supabase.from('wards').select('name').eq('id', profile.ward_id).single() : { data: null },
        profile.polling_unit_id ? supabase.from('polling_units').select('name, code').eq('id', profile.polling_unit_id).single() : { data: null },
        supabase.from('pu_team_members').select('role_title').eq('user_id', profile.id).single(),
        supabase.from('app_settings').select('id, value').in('id', ['show_ward_coordinator_info', 'show_state_coordinator_info'])
    ])

    const settingsMap = (settingsRes.data || []).reduce((acc: any, s: any) => ({ ...acc, [s.id]: s.value === 'true' }), {})

    // 3. Fetch Coordinators if settings allow
    const [wardCoordRes, stateCoordRes] = await Promise.all([
        settingsMap.show_ward_coordinator_info && profile.ward_id
            ? supabase.from('users').select('full_name, phone').eq('role', 'WARD_COORDINATOR').eq('ward_id', profile.ward_id).limit(1).maybeSingle()
            : { data: null },
        settingsMap.show_state_coordinator_info && profile.state_id
            ? supabase.from('users').select('full_name, phone').eq('role', 'STATE_COORDINATOR').eq('state_id', profile.state_id).limit(1).maybeSingle()
            : { data: null }
    ])

    const wardCoord = wardCoordRes.data
    const stateCoord = stateCoordRes.data

    const userState = stateRes.data?.name || 'N/A'
    const userLga = lgaRes.data?.name || 'N/A'
    const userWard = wardRes.data?.name || 'N/A'
    const puName = puRes.data?.name || 'N/A'
    const puCode = puRes.data?.code || ''
    const displayPu = puCode ? `${puCode}-${puName}` : puName

    const isAdminOrCoord = ['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR'].includes(profile.role)

    return (
        <AppShell profile={profile}>
            <div className="space-y-6">

                {/* Welcome Card - Optimized for Mobile First */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                                Hello, {profile.full_name.split(' ')[0]} 👋
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Welcome back. Everything looks good today.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-green-100">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-[10px] font-bold text-green-700 uppercase">Active</span>
                            </div>
                            {profile.verified && (
                                <div className="bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-blue-100">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Verified Agent</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">

                    {/* Left Column (8 units) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* News & Others Section */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                    <Newspaper className="w-5 h-5 text-green-600" /> Latest Updates
                                </h3>
                                <Link href="#" className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1 uppercase tracking-wider">
                                    All <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 hover:bg-slate-50 transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Election</span>
                                        <span className="text-slate-400 text-[10px]">2h ago</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-green-700 transition leading-snug">New Ward Verification Guidelines</h4>
                                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">Ensure all members use latest digital identity cards...</p>
                                </div>
                                <div className="p-4 hover:bg-slate-50 transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Update</span>
                                        <span className="text-slate-400 text-[10px]">1d ago</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-green-700 transition leading-snug">Advanced Filters Released</h4>
                                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">Search by phone or name in the management panel...</p>
                                </div>
                            </div>
                        </section>

                        {/* Location Context Widget */}
                        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <MapPin className="w-3.5 h-3.5" /> My Scope
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Ward</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{userWard}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 uppercase font-black mb-1">State</p>
                                    <p className="text-xs font-bold text-slate-700">{userState}</p>
                                </div>
                                <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Polling Unit</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{displayPu}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column (4 units) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Card Widget */}
                        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/30 transition duration-1000"></div>
                            <div className="relative flex flex-col h-full justify-between gap-6 md:gap-8">
                                <div className="flex justify-between items-start">
                                    <Shield className="w-8 h-8 text-green-500" />
                                    <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase">Obidient Member</span>
                                </div>
                                <div className="mt-2">
                                    <p className="text-slate-400 text-[9px] uppercase font-bold tracking-[0.3em] mb-1">Identity ID</p>
                                    <p className="text-white font-mono text-lg md:text-xl tracking-[0.2em]">
                                        {profile.membership_number || 'AWAITING VERIF.'}
                                    </p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="max-w-[150px]">
                                        <p className="text-white text-sm font-bold uppercase truncate">{profile.full_name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-slate-500 text-[9px] uppercase tracking-wide">{profile.role.replace('_', ' ')}</p>
                                            <span className="text-slate-700">|</span>
                                            <Link href="/profile" className="text-green-500 text-[9px] uppercase font-bold hover:text-green-400 transition">Edit</Link>
                                        </div>
                                    </div>
                                    <CheckCircle className={`w-5 h-5 ${profile.verified ? 'text-green-500' : 'text-slate-700'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Command Center - Desktop sidebar action card */}
                        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hidden md:block">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-3 mb-6">
                                <div className="bg-slate-100 p-1.5 rounded-lg">
                                    <LayoutGrid className="w-4 h-4 text-slate-600" />
                                </div>
                                Command Center
                            </h3>
                            <div className="space-y-3">
                                {isAdminOrCoord && (
                                    <Link href="/admin/members" className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-green-50 rounded-2xl group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:text-green-600 text-slate-400 transition-colors">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">All Members</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                                <Link href="/admin/sms" className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-green-50 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:text-green-600 text-slate-400 transition-colors">
                                            <Newspaper className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">SMS Broadcast</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/profile" className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-green-50 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:text-green-600 text-slate-400 transition-colors">
                                            <UserCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Edit Profile</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </section>

                        {/* Support Info */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b pb-3">
                                <Info className="w-4 h-4" /> Support Team
                            </h4>
                            <div className="space-y-3">
                                {wardCoord && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Ward Coordinator</p>
                                        <p className="text-xs font-bold text-slate-800">{wardCoord.full_name}</p>
                                        <p className="text-xs text-green-600 font-medium mt-1">{wardCoord.phone}</p>
                                    </div>
                                )}
                                {stateCoord && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">State Coordinator</p>
                                        <p className="text-xs font-bold text-slate-800">{stateCoord.full_name}</p>
                                        <p className="text-xs text-green-600 font-medium mt-1">{stateCoord.phone}</p>
                                    </div>
                                )}
                                <Link href="https://t.me/obidient_connect" target="_blank" className="w-full flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-xl font-bold text-xs hover:bg-green-100 transition">
                                    Join Telegram Community <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppShell>
    )
}
