import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import EmailBroadcastClient from './client'
import { Mail } from 'lucide-react'

export default async function EmailBroadcastPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile || !['ADMIN', 'STATE_COORDINATOR', 'LGA_COORDINATOR', 'WARD_COORDINATOR'].includes(profile.role)) {
        redirect('/dashboard')
    }

    return (
        <AppShell profile={profile} title="Email Broadcast" backHref="/dashboard">
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Mail className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                        COMMUNITY EMAILER
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Send unlimited broadcast messages to your members via Resend.</p>
                </div>
            </div>

            <EmailBroadcastClient />
        </AppShell>
    )
}
