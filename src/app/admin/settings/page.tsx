import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { getAppSettings } from '@/app/actions/config'
import SystemSettingsClient from '@/components/SystemSettingsClient'

export default async function SystemSettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    const initialSettings = await getAppSettings()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/members" className="text-gray-500 hover:text-indigo-600 transition">
                            <ArrowLeft className="w-5 h-5 mr-1 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
                            <Settings2 className="w-6 h-6" /> System Configuration
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Global AI & Provider Settings</h2>
                    <p className="text-sm text-gray-500">Configure AI personality, API credentials, and service behaviors. These settings take precedence over environment variables.</p>
                </div>

                <SystemSettingsClient initialSettings={initialSettings} />
            </main>
        </div>
    )
}
