import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { getPollingUnitsWithTeamCounts } from '@/app/actions/teams'
import AdminPollingUnitsClient from '@/components/AdminPollingUnitsClient'

export default async function AdminPollingUnitsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('id, role, ward_id').eq('id', user.id).single()
    if (!profile || !['ADMIN', 'STATE_COORDINATOR', 'LGA_COORDINATOR', 'WARD_COORDINATOR'].includes(profile.role)) {
        redirect('/dashboard')
    }

    const pollingUnits = await getPollingUnitsWithTeamCounts()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/members" className="text-gray-500 hover:text-green-600 transition">
                            <ArrowLeft className="w-5 h-5 mr-1 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            <LayoutGrid className="w-6 h-6" /> Polling Unit Teams
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">5-Man Team Coverage</h2>
                    <p className="text-sm text-gray-500">Monitor and manage team deployments across all polling units in your jurisdiction.</p>
                </div>

                <AdminPollingUnitsClient initialUnits={pollingUnits} />
            </main>
        </div>
    )
}
