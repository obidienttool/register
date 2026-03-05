import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SMSBroadcastClient from './client'
import AppShell from '@/components/AppShell'

export default async function SMSBroadcastPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    const allowedRoles = ['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR']
    if (!allowedRoles.includes(profile.role)) {
        redirect('/dashboard')
    }

    return (
        <AppShell profile={profile} title="Operations Broadcast" backHref="/dashboard">
            <SMSBroadcastClient />
        </AppShell>
    )
}
