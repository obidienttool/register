import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { getStaffMembers } from '@/app/actions/members'
import StaffManagerClient from '@/components/StaffManagerClient'

export default async function StaffManagerPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    const staff = await getStaffMembers()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/members" className="text-gray-500 hover:text-indigo-600 transition">
                            <ArrowLeft className="w-5 h-5 mr-1 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
                            <Shield className="w-6 h-6" /> Staff & Role Management
                        </h1>
                    </div>
                    <div className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 uppercase tracking-tighter">
                        Restricted: Root Admin
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Current Staff Directory</h2>
                    <p className="text-sm text-gray-500">Manage administrative roles and geographic assignments for all regional coordinators.</p>
                </div>

                <StaffManagerClient initialStaff={staff} />
            </main>
        </div>
    )
}
