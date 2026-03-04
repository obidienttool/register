import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'
import SMSBroadcastClient from './client'

export default async function SMSBroadcastPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const allowedRoles = ['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR']
    if (!allowedRoles.includes(profile.role)) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-green-600 transition flex items-center gap-1">
                            <ArrowLeft className="w-5 h-5 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            <Megaphone className="w-6 h-6" /> Operations Broadcast
                        </h1>
                    </div>
                    <div className="text-sm rounded hover:bg-gray-100 px-3 py-1 font-medium border text-gray-700 flex items-center gap-3">
                        <Link href="/admin/members" className="text-blue-600 hover:underline">Manage Network</Link>
                        <span className="text-gray-300">|</span>
                        Active Persona: {profile.role}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <SMSBroadcastClient />
            </main>
        </div>
    )
}
