'use server'

import { createClient } from '@/utils/supabase/server'
import { analyzeNetworkMetrics } from '@/lib/ai'
import { logAuditEvent } from './audit'

export async function generateNetworkMetrics() {
    const supabase = await createClient()

    // 1. Authentication verify checking root Admin status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized AI invocation")

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') throw new Error("Forbidden Strategy Terminal")

    // 2. Heavy Data Aggregation Queries via Node Arrays
    // Since this is Analytics, pulling users into memory locally is fast enough for early phases,
    // though actual production scaling demands Supabase SQL RPCs for pure map-reducing.
    const { data: users, error } = await supabase.from('users').select('id, verified, state_id, lga_id, polling_unit_id, role, created_at')
    const { data: pu_teams } = await supabase.from('pu_team_members').select('polling_unit_id')
    const { data: sms_logs } = await supabase.from('sms_logs').select('sent_by, created_at')
    const { data: states } = await supabase.from('states').select('id, name')
    const { data: lgas } = await supabase.from('lgas').select('id, name')

    if (error || !users || !states || !lgas) throw new Error("Metrics compilation failure")

    // Dictionaries for mapping strings to names safely
    const stateMap = new Map(states.map(s => [s.id, s.name]))
    const lgaMap = new Map(lgas.map(l => [l.id, l.name]))

    // Base Numbers
    const totalMembers = users.length
    const totalVerified = users.filter(u => u.verified).length

    // Growth
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSignups = users.filter(u => new Date(u.created_at).getTime() > sevenDaysAgo).length

    // State / LGA Metrics Map
    const stateStats = new Map()
    const lgaStats = new Map()
    users.forEach(u => {
        if (u.state_id) {
            if (!stateStats.has(u.state_id)) stateStats.set(u.state_id, { count: 0, verified: 0 })
            stateStats.get(u.state_id).count++
            if (u.verified) stateStats.get(u.state_id).verified++
        }
        if (u.lga_id) {
            if (!lgaStats.has(u.lga_id)) lgaStats.set(u.lga_id, { count: 0, verified: 0 })
            lgaStats.get(u.lga_id).count++
            if (u.verified) lgaStats.get(u.lga_id).verified++
        }
    })

    const verifiedPerState = Array.from(stateStats.entries()).map(([id, d]) => ({
        state: stateMap.get(id) || 'Unknown',
        total: d.count,
        verifiedPercent: Math.round((d.verified / d.count) * 100)
    }))

    const lgaRatios = Array.from(lgaStats.entries()).map(([id, d]) => ({
        id,
        name: lgaMap.get(id) || 'Unknown',
        total: d.count,
        verifiedPercent: Math.round((d.verified / d.count) * 100)
    }))

    // Sort LGAs by absolute total for Strength
    const sortedLgas = [...lgaRatios].sort((a, b) => b.total - a.total)
    const top5Lgas = sortedLgas.slice(0, 5)
    // Avoid completely empty LGAs hitting the bottom improperly by adding standard threshold
    const bottom5Lgas = sortedLgas.filter(l => l.total > 0).reverse().slice(0, 5)

    // PU Team Coverages
    const uniquePus = new Set(users.map(u => u.polling_unit_id).filter(Boolean))
    const coveredPus = new Set(pu_teams?.map(t => t.polling_unit_id))
    const puCoverage = uniquePus.size > 0 ? Math.round((coveredPus.size / uniquePus.size) * 100) : 0

    // SMS Activity & Coordinator Inactivity rule
    const smsCountMap = new Map()
    sms_logs?.forEach(s => {
        smsCountMap.set(s.sent_by, (smsCountMap.get(s.sent_by) || 0) + 1)
    })

    const coordinators = users.filter(u => ['STATE_COORDINATOR', 'LGA_COORDINATOR', 'WARD_COORDINATOR'].includes(u.role))
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

    // Inactive coordinators rule
    const inactiveCoordinatorsCount = coordinators.filter(c => {
        const latestSms = sms_logs?.filter(s => s.sent_by === c.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        if (!latestSms) return true; // never sent
        return new Date(latestSms.created_at).getTime() < thirtyDaysAgo
    }).length

    // Risk Flags (Pre-AI)
    const weakLGAFlags = lgaRatios.filter(l => l.verifiedPercent < 20 && l.total > 5).map(l => l.name) // Min 5 users to count as valid risk flag
    const zeroTeamPUs = Array.from(uniquePus).filter(puId => !coveredPus.has(puId)).length

    const riskFlags = {
        lgas_sub_20_percent_verified: weakLGAFlags,
        pus_with_zero_team_members: zeroTeamPUs,
        inactive_coordinators_last_30_days: inactiveCoordinatorsCount
    }

    const payload = {
        core: { totalMembers, totalVerified, recentSignups, puCoveragePercent: puCoverage },
        state_distribution: verifiedPerState,
        top_lgas: top5Lgas,
        bottom_lgas_by_volume: bottom5Lgas,
        system_risks: riskFlags
    }

    return { payload, riskFlags }
}

export async function checkRateLimitAndGenerate() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Check rate limit: Max 5 AI reports per day total
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase.from('ai_reports_cache')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)

    if ((count || 0) >= 5) {
        return { success: false, error: 'Daily Limit Reached. AI Strategy Module supports maximum 5 generations per 24 hours to prevent extreme cost overruns.' }
    }

    // 1. Compile Metrics
    const metricsData = await generateNetworkMetrics()

    // 2. Run OpenAI Execution
    const aiAnalysis = await analyzeNetworkMetrics(metricsData.payload)

    // 3. Store Cache & Audit Log
    const { data: cachedRow, error } = await supabase.from('ai_reports_cache').insert({
        created_by: user.id,
        metrics_snapshot: metricsData.payload,
        ai_response: aiAnalysis
    }).select('id').single()

    if (error) console.error("Cache AI save error:", error)

    await logAuditEvent('AI_STRATEGY_GENERATED', { cache_id: cachedRow?.id, generated_sections: Object.keys(aiAnalysis).length })

    return { success: true, aiAnalysis, riskFlags: metricsData.riskFlags, metrics: metricsData.payload }
}

export async function fetchLatestAICache() {
    const supabase = await createClient()
    const { data } = await supabase.from('ai_reports_cache')
        .select('*, creator:users(full_name)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return data || null
}
