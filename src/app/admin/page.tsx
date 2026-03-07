import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['ADMIN', 'STATE_COORDINATOR', 'LGA_COORDINATOR', 'WARD_COORDINATOR'].includes(profile.role)) {
        redirect('/dashboard')
    }

    // Default admin landing page is the network management
    redirect('/admin/members')
}
