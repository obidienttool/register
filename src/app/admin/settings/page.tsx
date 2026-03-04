import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import AdminSettingsClient from '@/components/AdminSettingsClient'
import {
    getSettings,
    getSystemStatsForAdmin,
    getCoordinators,
    getBackups,
    getSystemUpdates
} from '@/app/actions/settings'

export default async function AdminSettingsPage() {
    const supabase = await createClient()

    // 1. Enforce strict ADMIN routing
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard') // Access Denied explicitly to all except absolute Admin.
    }

    // 2. Fetch all configuration data concurrently
    const [settings, stats, coordinators, backups, updates] = await Promise.all([
        getSettings(),
        getSystemStatsForAdmin(),
        getCoordinators(),
        getBackups(),
        getSystemUpdates()
    ])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-gray-900 text-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition flex items-center gap-1">
                            <ArrowLeft className="w-5 h-5 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Settings className="w-6 h-6 text-green-500" /> Platform Governance
                        </h1>
                    </div>
                    <div className="text-sm rounded bg-gray-800 px-3 py-1 font-medium border border-gray-700 flex items-center gap-3">
                        <span className="text-green-400 tracking-wider">ROOT OVERRIDES ENABLED</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <AdminSettingsClient
                    settings={settings}
                    stats={stats}
                    coordinators={coordinators}
                    backups={backups}
                    updates={updates}
                />
            </main>
        </div>
    )
}
