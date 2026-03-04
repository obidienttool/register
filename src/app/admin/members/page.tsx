import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Cpu } from 'lucide-react'
import AdminMembersClient from '@/components/AdminMembersClient'

export default async function AdminMembersPage() {
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

    // Restrict access
    const allowedRoles = ['ADMIN', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_COORDINATOR']
    if (!allowedRoles.includes(profile.role)) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-green-600 transition">
                            <ArrowLeft className="w-5 h-5 mr-1 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                            <Users className="w-6 h-6" /> Members Administration
                        </h1>
                    </div>
                    <div className="text-sm rounded hover:bg-gray-100 px-3 py-1 font-medium border text-gray-700 flex items-center gap-3">
                        {profile.role === 'ADMIN' && (
                            <>
                                <Link href="/admin/intelligence" className="text-purple-600 font-bold hover:underline flex items-center gap-1"><Cpu className="w-4 h-4" />Strategy AI</Link>
                                <span className="text-gray-300">|</span>
                                <Link href="/admin/settings" className="text-red-600 font-bold hover:underline">Root Settings</Link>
                                <span className="text-gray-300">|</span>
                            </>
                        )}
                        <Link href="/admin/sms" className="text-blue-600 hover:underline">SMS Operations</Link>
                        <span className="text-gray-300">|</span>
                        <Link href="/admin/analytics" className="text-blue-600 hover:underline">View Analytics</Link>
                        <span className="text-gray-300">|</span>
                        Active Persona: {profile.role}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <AdminMembersClient callerRole={profile.role} />
            </main>
        </div>
    )
}
