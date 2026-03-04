'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAnalyticsSummary() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) return null

    // For security, coordinators only see their zones
    let baseQuery = supabase.from('users').select('id, verified, state_id, lga_id')
    if (profile.role === 'WARD_COORDINATOR') baseQuery = baseQuery.eq('ward_id', profile.ward_id)
    if (profile.role === 'LGA_COORDINATOR') baseQuery = baseQuery.eq('lga_id', profile.lga_id)
    if (profile.role === 'STATE_COORDINATOR') baseQuery = baseQuery.eq('state_id', profile.state_id)

    const { data: allMembers, error } = await baseQuery
    if (error || !allMembers) return null

    let totalVerified = 0;
    const statesMap: Record<number, number> = {}
    const lgasMap: Record<number, number> = {}

    allMembers.forEach(m => {
        if (m.verified) totalVerified++
        if (m.state_id) statesMap[m.state_id] = (statesMap[m.state_id] || 0) + 1
        if (m.lga_id) lgasMap[m.lga_id] = (lgasMap[m.lga_id] || 0) + 1
    })

    // For PU Team Members, query pu_team_members joining users to apply scope correctly
    // Since Supabase views are better for exact counts with joins, we will just fetch the counts matching our location scope
    let puQuery = supabase.from('users').select('id, pu_team:pu_team_members!inner(id)')
    if (profile.role === 'WARD_COORDINATOR') puQuery = puQuery.eq('ward_id', profile.ward_id)
    if (profile.role === 'LGA_COORDINATOR') puQuery = puQuery.eq('lga_id', profile.lga_id)
    if (profile.role === 'STATE_COORDINATOR') puQuery = puQuery.eq('state_id', profile.state_id)

    const { data: puData } = await puQuery
    const totalPuMembers = puData ? puData.length : 0

    // Resolve Names efficiently
    const { data: states } = await supabase.from('states').select('id, name')
    const { data: lgas } = await supabase.from('lgas').select('id, name')

    const membersByState = states?.map(s => ({
        name: s.name,
        count: statesMap[s.id] || 0
    })).filter(s => s.count > 0).sort((a, b) => b.count - a.count) || []

    const membersByLga = lgas?.map(l => ({
        id: l.id,
        name: l.name,
        count: lgasMap[l.id] || 0
    })).filter(l => l.count > 0).sort((a, b) => b.count - a.count) || []

    return {
        totalMembers: allMembers.length,
        totalVerified,
        totalPuMembers,
        membersByState,
        membersByLga
    }
}
