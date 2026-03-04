import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Cpu } from 'lucide-react'
import { fetchLatestAICache, generateNetworkMetrics } from '@/app/actions/intelligence'
import AIIntelligenceClient from '@/app/admin/intelligence/client'

export default async function AdminIntelligencePage() {
    const supabase = await createClient()

    // Authentication Gate - Root Admin Exclusive Module
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard') // Access Denied explicitly
    }

    const [latestCache, liveMetrics] = await Promise.all([
        fetchLatestAICache(),
        generateNetworkMetrics()
    ])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-indigo-900 border-b border-indigo-800 text-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition flex items-center gap-1">
                            <ArrowLeft className="w-5 h-5 inline" /> Back
                        </Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Cpu className="w-6 h-6 text-indigo-400" /> Strategic Intelligence AI
                        </h1>
                    </div>
                    <div className="text-sm rounded bg-indigo-950 px-3 py-1 font-mono border border-indigo-700 font-bold tracking-widest text-indigo-300">
                        {profile.role}_{profile.id.substring(0, 8)}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <AIIntelligenceClient initialCache={latestCache} liveRiskFlags={liveMetrics.riskFlags} />
            </main>
        </div>
    )
}
