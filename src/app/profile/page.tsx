import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ProfileClient from './client'

export default async function ProfilePage() {
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
        <AppShell profile={profile} title="Edit Profile" backHref="/dashboard">
            <div className="mb-8">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Personal Information</h2>
                <p className="text-sm text-slate-500 font-medium">Keep your account details up to date.</p>
            </div>
            <ProfileClient profile={profile} />
        </AppShell>
    )
}
