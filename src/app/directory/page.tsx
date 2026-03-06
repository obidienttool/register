import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import DirectoryClient from './DirectoryClient'

export default async function DirectoryPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    return (
        <AppShell profile={profile} title="Members Directory" backHref="/dashboard">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Directory</h2>
                <p className="text-sm text-slate-500 font-medium">Connect with fellow members in your ward.</p>
            </div>
            <DirectoryClient />
        </AppShell>
    )
}
