import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminMembersClient from '@/components/AdminMembersClient'
import AppShell from '@/components/AppShell'

export default async function AdminMembersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile || !['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR'].includes(profile.role)) {
        redirect('/dashboard')
    }

    return (
        <AppShell profile={profile} title="Members Directory">
            <AdminMembersClient callerRole={profile.role} />
        </AppShell>
    )
}
