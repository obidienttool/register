import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { LogOut, User, MapPin, Shield, CheckCircle, XCircle, Users } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/login')
    }

    // Fetch full profile, joined location names, and team status
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
      *,
      state:states(name),
      lga:lgas(name),
      ward:wards(name),
      polling_unit:polling_units(name, code),
      pu_team:pu_team_members(role_title)
    `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        // If user deleted from public.users somehow or error formatting
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-red-600 font-bold mb-2">Error loading profile</p>
                <p className="text-sm text-gray-600 mb-4">{profileError ? profileError.message : 'Profile record not found.'}</p>
                <form action={logout}><button className="underline text-green-600">Logout & Try again</button></form>
            </div>
        )
    }

    const userState = (profile.state as any)?.name || 'N/A'
    const userLga = (profile.lga as any)?.name || 'N/A'
    const userWard = (profile.ward as any)?.name || 'N/A'
    const puName = (profile.polling_unit as any)?.name || 'N/A'
    const puCode = (profile.polling_unit as any)?.code || ''
    const displayPu = puCode ? `${puCode} - ${puName}` : puName

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-green-700">Dashboard</h1>
                    <div className="flex items-center space-x-6">
                        {['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR'].includes(profile.role) && (
                            <Link href="/admin/members" className="flex items-center text-green-700 font-medium hover:text-green-800 transition">
                                <Users className="w-5 h-5 mr-1" />
                                Admin Panel
                            </Link>
                        )}
                        <form action={logout}>
                            <button type="submit" className="flex items-center text-gray-600 hover:text-green-600 transition">
                                <LogOut className="w-5 h-5 mr-1" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                        <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                            <p className="text-gray-500">{profile.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                                <Shield className="w-5 h-5 mr-2 text-green-600" /> Account Status
                            </h3>

                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-500 mb-1">Assigned Role</p>
                                <p className="font-medium text-gray-900">{profile.role}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Verification Status</p>
                                    <p className="font-medium text-gray-900 flex items-center">
                                        {profile.verified ? (
                                            <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Verified</span>
                                        ) : (
                                            <span className="text-amber-600 flex items-center"><XCircle className="w-4 h-4 mr-1" /> Unverified</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {profile.verified && profile.membership_number && (
                                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                                    <p className="text-sm text-green-800 mb-1">Membership ID</p>
                                    <p className="font-bold text-green-900 text-xl tracking-wider">{profile.membership_number}</p>
                                </div>
                            )}

                            {profile.pu_team && profile.pu_team.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mt-4">
                                    <p className="text-sm text-blue-800 mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                        <Shield className="w-4 h-4 text-blue-800" /> Polling Unit Team Member
                                    </p>
                                    <p className="font-bold text-blue-900 text-lg">{profile.pu_team[0].role_title}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                                <MapPin className="w-5 h-5 mr-2 text-green-600" /> Location Hierarchy
                            </h3>

                            <div className="bg-gray-50 p-4 rounded-md border-l-4 border-green-500">
                                <div className="space-y-3 relative">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">State</span>
                                        <p className="text-gray-900 font-medium">{userState}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Local Government</span>
                                        <p className="text-gray-900 font-medium">{userLga}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ward</span>
                                        <p className="text-gray-900 font-medium">{userWard}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Polling Unit</span>
                                        <p className="text-gray-900 font-medium">{displayPu}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
