import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getAppSettings } from '@/app/actions/config'
import SystemSettingsClient from '@/components/SystemSettingsClient'
import AppShell from '@/components/AppShell'

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
        <AppShell profile={profile} title="System Configuration" backHref="/admin/members">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Global AI & Provider Settings</h2>
                <p className="text-sm text-slate-500">Configure AI personality, API credentials, and service behaviors.</p>
            </div>
            <SystemSettingsClient initialSettings={initialSettings} />
        </AppShell>
    )
}
