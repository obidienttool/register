import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UnregisteredMembersClient from '@/components/UnregisteredMembersClient'

export const metadata = {
    title: 'Unregistered Members | Obidient Register',
}

export default async function UnregisteredMembersPage() {
    const supabase = await createClient()

    // 1. Check Auth & Role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    // 2. Fetch Data Categories

    // Section A: Not Registered Voters (is_registered_voter = false AND age >= 18)
    const { data: unregistered } = await supabase
        .from('users')
        .select(`
            *,
            states(name),
            lgas(name),
            registered_polling_unit:polling_units!registered_polling_unit_id(name, code),
            intended_polling_unit:polling_units!intended_polling_unit_id(name, code)
        `)
        .eq('is_registered_voter', false)
        .gte('age', 18)
        .order('created_at', { ascending: false })

    // Section B: Members Requesting Registration Help (needs_registration_help = true)
    const { data: helpRequested } = await supabase
        .from('users')
        .select(`
            *,
            states(name),
            lgas(name),
            registered_polling_unit:polling_units!registered_polling_unit_id(name, code),
            intended_polling_unit:polling_units!intended_polling_unit_id(name, code)
        `)
        .eq('needs_registration_help', true)
        .order('created_at', { ascending: false })

    // Section C: Under 18 Members (is_under_18 = true)
    const { data: under18 } = await supabase
        .from('users')
        .select(`
            *,
            states(name),
            lgas(name),
            registered_polling_unit:polling_units!registered_polling_unit_id(name, code),
            intended_polling_unit:polling_units!intended_polling_unit_id(name, code)
        `)
        .eq('is_under_18', true)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Unregistered Members Intelligence</h1>
                    <p className="mt-1 text-sm text-gray-500">Track and manage members who are not yet registered voters or need assistance.</p>
                </div>

                <UnregisteredMembersClient
                    unregistered={unregistered || []}
                    helpRequested={helpRequested || []}
                    under18={under18 || []}
                />
            </div>
        </div>
    )
}
