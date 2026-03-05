import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import {
    LogOut, User, MapPin, Shield, CheckCircle,
    XCircle, Users, Bell, Newspaper, ExternalLink,
    ChevronRight, ArrowRight, Settings, Info
} from 'lucide-react'
import Link from 'next/link'

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
                <form action={logout}><button className="underline text-green-600">Logout & Try again</button></form>
            </div>
        )
    }

    // 2. Fetch specialized data separately to avoid ambiguous join errors
    const [stateRes, lgaRes, wardRes, puRes, teamRes] = await Promise.all([
        profile.state_id ? supabase.from('states').select('name').eq('id', profile.state_id).single() : { data: null },
        profile.lga_id ? supabase.from('lgas').select('name').eq('id', profile.lga_id).single() : { data: null },
        profile.ward_id ? supabase.from('wards').select('name').eq('id', profile.ward_id).single() : { data: null },
        profile.polling_unit_id ? supabase.from('polling_units').select('name, code').eq('id', profile.polling_unit_id).single() : { data: null },
        supabase.from('pu_team_members').select('role_title').eq('user_id', profile.id).single()
    ])

    const userState = stateRes.data?.name || 'N/A'
    const userLga = lgaRes.data?.name || 'N/A'
    const userWard = wardRes.data?.name || 'N/A'
    const puName = puRes.data?.name || 'N/A'
    const puCode = puRes.data?.code || ''
    const displayPu = puCode ? `${puCode}-${puName}` : puName
    const puTeamRole = teamRes.data?.role_title || null

    const isAdminOrCoord = ['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR'].includes(profile.role)

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
            {/* Professional Thin Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-600 p-1.5 rounded-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">Obidient Connect</h1>
                            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">{profile.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-50 rounded-full transition relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900">{profile.full_name}</p>
                                <p className="text-xs text-slate-500">{profile.phone}</p>
                            </div>
                            <form action={logout}>
                                <button type="submit" className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition duration-200">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">

                {/* Welcome / Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Hello, {profile.full_name.split(' ')[0]} 👋</h2>
                            <p className="text-slate-500 text-sm mt-1">Welcome back to your command center. Everything looks good today.</p>
                        </div>
                        <div className="mt-4 flex gap-4">
                            <div className="bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-bold text-green-700 uppercase">Active Member</span>
                            </div>
                            {profile.verified && (
                                <div className="bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-bold text-blue-700 uppercase">Verified Agent</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location Scope</p>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                                <p className="font-bold text-slate-900 truncate">{userWard}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{userState}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">My Network</p>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Polling Unit</p>
                                <p className="text-[10px] text-slate-500 uppercase truncate max-w-[120px]">{displayPu}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column (8 units) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* News & Others Section */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Newspaper className="w-5 h-5 text-green-600" /> Official Updates
                                </h3>
                                <Link href="#" className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1">
                                    View Archive <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="p-5 hover:bg-slate-50 transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Election Policy</span>
                                        <span className="text-slate-400 text-xs">2h ago</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-green-700 transition">New Ward Verification Guidelines for coordinators</h4>
                                    <p className="text-slate-500 text-sm mt-1 line-clamp-2">Please ensure all members are verified using the latest digital identity cards. The system now supports fallback location codes...</p>
                                </div>
                                <div className="p-5 hover:bg-slate-50 transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">System Update</span>
                                        <span className="text-slate-400 text-xs">1 day ago</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-green-700 transition">Member Search & Advanced Filters Released</h4>
                                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">Administrators can now search for members by phone number or name directly from the management panel...</p>
                                </div>
                                <div className="p-4 text-center">
                                    <button className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto">
                                        No more updates today
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Secondary Location Hierarchy (Compact Version) */}
                        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-3">
                                <MapPin className="w-4 h-4 text-slate-400" /> Assignment Hierarchy
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">State</p>
                                    <p className="text-xs font-bold text-slate-700">{userState}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">LGA</p>
                                    <p className="text-xs font-bold text-slate-700">{userLga}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Ward</p>
                                    <p className="text-xs font-bold text-slate-700">{userWard}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">PU</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{puName}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column (4 units) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Identity Widget (The Membership Card) */}
                        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            {/* Abstract Background Effect */}
                            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/30 transition duration-1000"></div>
                            <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

                            <div className="relative flex flex-col h-full justify-between gap-8">
                                <div className="flex justify-between items-start">
                                    <Shield className="w-8 h-8 text-green-500" />
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Obidient Member Card</span>
                                </div>

                                <div className="mt-2">
                                    {profile.verified && profile.membership_number ? (
                                        <>
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Identity ID</p>
                                            <p className="text-white font-mono text-xl tracking-[0.2em]">{profile.membership_number}</p>
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-slate-400 text-xs italic">Awaiting Verification...</p>
                                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="bg-amber-500 h-full w-[40%]"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-white text-sm font-bold uppercase">{profile.full_name}</p>
                                        <p className="text-slate-500 text-[10px] uppercase tracking-wide">{profile.role.replace('_', ' ')}</p>
                                    </div>
                                    <div className="p-2 border border-slate-800 rounded-lg">
                                        <CheckCircle className={`w-4 h-4 ${profile.verified ? 'text-green-500' : 'text-slate-600'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Settings className="w-4 h-4 text-slate-400" /> Command Center
                            </h3>
                            <div className="space-y-2">
                                {isAdminOrCoord && (
                                    <Link href="/admin/members" className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-green-50 rounded-xl group transition">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-green-600 text-slate-600">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">All Members</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition" />
                                    </Link>
                                )}

                                {isAdminOrCoord && (
                                    <Link href="/admin/sms" className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-green-50 rounded-xl group transition">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-green-600 text-slate-600">
                                                <Newspaper className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">SMS Broadcast</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition" />
                                    </Link>
                                )}

                                <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-400">Edit Profile</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-200" />
                                </button>
                            </div>
                        </section>

                        {/* Help Widget */}
                        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200">
                            <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 mb-2">
                                <Info className="w-3 h-3" /> Need Assistance?
                            </h4>
                            <p className="text-xs text-slate-600 mb-4">Contact your Ward Coordinator if you notice any discrepancies in your location assignments.</p>
                            <Link href="https://t.me/obidient_connect" target="_blank" className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline">
                                Official Telegram Support <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    )
}
