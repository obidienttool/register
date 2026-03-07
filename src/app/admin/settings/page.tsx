import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getAppSettings } from '@/app/actions/config'
import ConsolidatedSettingsClient from '@/components/admin/settings/ConsolidatedSettingsClient'
import AppShell from '@/components/AppShell'
import { Settings as SettingsIcon } from 'lucide-react'

export default async function SystemSettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    const initialSettings = await getAppSettings()

    return (
        <AppShell profile={profile} title="Settings Hub" backHref="/dashboard">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                    <div className="bg-green-600 p-2 rounded-xl shadow-lg shadow-green-200">
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    Global Command Center
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage AI personality, communications, modules, and system behavior.</p>
            </div>
            <ConsolidatedSettingsClient initialSettings={initialSettings} />
        </AppShell>
    )
}
