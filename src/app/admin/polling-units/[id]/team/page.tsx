import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ServerCrash, Users } from 'lucide-react'
import AdminTeamClient from '@/components/AdminTeamClient'
import {
    authorizeTeamManagement,
    getPollingUnitDetails,
    getTeamMembers,
    getVerifiedMembersInPu
} from '@/app/actions/teams'

export default async function PollingUnitTeamPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;
    const puId = parseInt(resolvedParams.id, 10);

    // 1. Check Role Context
    const profile = await authorizeTeamManagement()
    if (!profile) {
        redirect('/dashboard')
    }

    // 2. Fetch required details
    const [pu, team, verifiedMembers] = await Promise.all([
        getPollingUnitDetails(puId),
        getTeamMembers(puId),
        getVerifiedMembersInPu(puId)
    ])

    if (!pu) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <ServerCrash className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Polling Unit Not Found</h1>
                <Link href="/admin/members" className="text-green-600 underline">Return to Admin</Link>
            </div>
        )
    }

    // 3. Prevent Ward Coordinator from assigning out of scope
    if (profile.role === 'WARD_COORDINATOR' && pu.ward_id !== profile.ward_id) {
        redirect('/admin/members')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/members" className="text-gray-500 hover:text-green-600 transition">
                            <ArrowLeft className="w-5 h-5 mr-1 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            <Users className="w-6 h-6" /> Team Assignment
                        </h1>
                    </div>
                    <div className="text-sm bg-green-50 text-green-800 rounded px-3 py-1 font-medium border border-green-200 shadow-sm">
                        {pu.code ? `${pu.code} - ` : ''}{pu.name}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="bg-white shadow overflow-hidden rounded-lg p-6 mb-6">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Location Context</p>
                    <div className="text-lg font-bold text-gray-900">
                        {pu.ward?.lga?.state?.name} → {pu.ward?.lga?.name} → {pu.ward?.name} → <span className="text-green-600">{pu.name}</span>
                    </div>
                </div>

                {/* Client Interactive Flow */}
                <AdminTeamClient
                    puId={puId}
                    initialTeam={team as any}
                    availableVerifiedMembers={verifiedMembers as any}
                />
            </main>
        </div>
    )
}
