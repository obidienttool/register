'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function authorizeTeamManagement() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) return null

    // Ensure role is strictly ADMIN or WARD_COORDINATOR
    if (profile.role !== 'ADMIN' && profile.role !== 'WARD_COORDINATOR') return null
    return profile
}

export async function getPollingUnitDetails(puId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('polling_units')
        .select('*, ward:wards(name, lga:lgas(name, state:states(name)))')
        .eq('id', puId).single()

    if (error) return null
    return data
}

export async function getTeamMembers(puId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('pu_team_members')
        .select('*, user:users!user_id(id, full_name, phone, membership_number)')
        .eq('polling_unit_id', puId)
        .order('created_at', { ascending: true })

    if (error) return []
    return data
}

export async function getVerifiedMembersInPu(puId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('users')
        .select('id, full_name, phone, membership_number')
        .eq('polling_unit_id', puId)
        .eq('verified', true)

    if (error) return []
    return data
}

export async function assignTeamMemberAction(userId: string, puId: number, roleTitle: string) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('assign_pu_team_member', {
        target_user_id: userId,
        target_pu_id: puId,
        target_role_title: roleTitle
    })

    if (error) {
        if (error.message.includes('one_team_per_user')) {
            return { success: false, error: 'User is already assigned to a team' }
        }
        return { success: false, error: error.message || 'Assignment failed' }
    }

    revalidatePath(`/admin/polling-units/${puId}/team`)
    return { success: true }
}

export async function removeTeamMemberAction(userId: string, puId: number) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('remove_pu_team_member', {
        target_user_id: userId,
        target_pu_id: puId
    })

    if (error) {
        return { success: false, error: error.message || 'Removal failed' }
    }

    revalidatePath(`/admin/polling-units/${puId}/team`)
    return { success: true }
}
export async function getPollingUnitsWithTeamCounts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('users').select('role, state_id, lga_id, ward_id').eq('id', user.id).single()
    if (!profile) return []

    // Simplified query for now: list all PUs visible to this user
    let query = supabase.from('polling_units')
        .select(`
            id,
            name,
            code,
            ward:wards(
                id,
                name,
                lga:lgas(
                    id,
                    name,
                    state:states(id, name)
                )
            )
        `)

    // RBAC Filter
    if (profile.role === 'WARD_COORDINATOR') {
        query = query.eq('ward_id', profile.ward_id)
    } else if (profile.role === 'LGA_COORDINATOR') {
        // We'll filter the resulting array to keep it simple and compatible
    } else if (profile.role === 'STATE_COORDINATOR') {
        // Filter resulting array
    }

    const { data, error } = await query.order('name', { ascending: true }).limit(500)
    if (error) return []

    // Fetch counts separately to avoid complex join issues
    const { data: teams } = await supabase.from('pu_team_members').select('polling_unit_id')
    const teamCounts = new Map()
    teams?.forEach(t => {
        teamCounts.set(t.polling_unit_id, (teamCounts.get(t.polling_unit_id) || 0) + 1)
    })

    // Filter and Map
    let results = data as any[]

    if (profile.role === 'LGA_COORDINATOR') {
        results = results.filter(pu => pu.ward?.lga?.id === profile.lga_id)
    } else if (profile.role === 'STATE_COORDINATOR') {
        results = results.filter(pu => pu.ward?.lga?.state?.id === profile.state_id)
    }

    return results.map(pu => ({
        ...pu,
        team_count: teamCounts.get(pu.id) || 0
    }))
}
