'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function verifyMemberAction(targetUserId: string) {
    const supabase = await createClient()

    // The RPC function `verify_member_fn` enforces RBAC internally
    // (Caller must be ADMIN, or WARD_COORDINATOR of the same ward)
    const { data, error } = await supabase.rpc('verify_member_fn', { target_user_id: targetUserId })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/members')
    return { success: true, membershipNumber: data }
}

export async function promoteMemberAction(targetUserId: string, newRole: string) {
    const supabase = await createClient()

    // The RPC function `promote_member_fn` enforces RBAC internally
    // (Caller must be ADMIN)
    const { error } = await supabase.rpc('promote_member_fn', { target_user_id: targetUserId, new_role: newRole })

    if (error) {
        // Convert constraint errors to friendly messages
        if (error.message.includes('one_ward_coordinator')) {
            return { success: false, error: 'A Ward Coordinator already exists for this Ward.' }
        }
        if (error.message.includes('one_lga_coordinator')) {
            return { success: false, error: 'An LGA Coordinator already exists for this LGA.' }
        }
        if (error.message.includes('one_state_coordinator')) {
            return { success: false, error: 'A State Coordinator already exists for this State.' }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/members')
    return { success: true }
}

export type MemberFilters = {
    stateId?: number;
    lgaId?: number;
    wardId?: number;
    puId?: number;
    role?: string;
    verified?: string; // 'yes' | 'no' | ''
    puTeamMember?: string; // 'yes' | 'no' | ''
}

export async function buildScopedMembersQuery(supabase: any, filters?: MemberFilters) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) return null

    // Determine if we need an inner join for pu_team_members (only when filtering for 'yes')
    const joinPuTeam = filters?.puTeamMember === 'yes' ? '!inner' : ''

    let query = supabase.from('users').select(`
        *,
        state:states(name),
        lga:lgas(name),
        ward:wards(name),
        polling_unit:polling_units(name, code),
        pu_team:pu_team_members${joinPuTeam}(role_title)
    `)

    // Apply RBAC filters
    if (profile.role === 'WARD_COORDINATOR') {
        query = query.eq('ward_id', profile.ward_id)
    } else if (profile.role === 'LGA_COORDINATOR') {
        query = query.eq('lga_id', profile.lga_id)
    } else if (profile.role === 'STATE_COORDINATOR') {
        query = query.eq('state_id', profile.state_id)
    } else if (profile.role !== 'ADMIN') {
        return null // Unauthorized
    }

    // Apply Location filters
    if (filters?.stateId) query = query.eq('state_id', filters.stateId)
    if (filters?.lgaId) query = query.eq('lga_id', filters.lgaId)
    if (filters?.wardId) query = query.eq('ward_id', filters.wardId)
    if (filters?.puId) query = query.eq('polling_unit_id', filters.puId)

    // Apply Advanced filters
    if (filters?.role) query = query.eq('role', filters.role)
    if (filters?.verified === 'yes') query = query.eq('verified', true)
    if (filters?.verified === 'no') query = query.eq('verified', false)

    return query
}

export async function getScopedMembers(filters?: MemberFilters) {
    const supabase = await createClient()
    let query = await buildScopedMembersQuery(supabase, filters)
    if (!query) return []

    // Pagination/Limit for view
    query = query.order('created_at', { ascending: false }).limit(200)

    const { data, error } = await query

    if (error) {
        console.error("Error fetching scoped members:", error)
        return []
    }

    // Handle 'no' filter for puTeamMember manually since Supabase doesn't easily IS NULL joined tables in PostgREST
    let results = data as any[];
    if (filters?.puTeamMember === 'no') {
        results = results.filter((r) => !r.pu_team || r.pu_team.length === 0)
    }

    return results
}

import * as XLSX from 'xlsx'

export async function exportMembersAction(filters?: MemberFilters, format: 'csv' | 'xlsx' = 'xlsx') {
    const supabase = await createClient()
    let query = await buildScopedMembersQuery(supabase, filters)
    if (!query) return { success: false, error: 'Unauthorized' }

    // Export query has NO limit to export all matching results
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        console.error("Error exporting members:", error)
        return { success: false, error: 'Export failed' }
    }

    let results = data as any[];
    if (filters?.puTeamMember === 'no') {
        results = results.filter((r) => !r.pu_team || r.pu_team.length === 0)
    }

    // Transform to flat rows
    const rows = results.map(row => ({
        'Full Name': row.full_name,
        'Phone': row.phone,
        'Email': row.email || '',
        'State': row.state?.name || '',
        'LGA': row.lga?.name || '',
        'Ward': row.ward?.name || '',
        'Polling Unit': row.polling_unit ? `${row.polling_unit.code ? row.polling_unit.code + ' - ' : ''}${row.polling_unit.name}` : '',
        'Role': row.role,
        'Verified': row.verified ? 'Yes' : 'No',
        'Membership Number': row.membership_number || '',
        'PU Team Role': row.pu_team && row.pu_team.length > 0 ? row.pu_team[0].role_title : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')

    // Generate buffer
    let fileBuffer;
    let mimeType;
    let extension;

    if (format === 'csv') {
        fileBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'buffer' })
        mimeType = 'text/csv'
        extension = 'csv'
    } else {
        fileBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'xlsx'
    }

    // Convert Buffer to Base64 to return via Server Action securely
    const base64File = fileBuffer.toString('base64')

    return {
        success: true,
        fileData: base64File,
        mimeType,
        fileName: `Obidient_Members_Export.${extension}`
    }
}
export async function getStaffMembers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') return []

    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            state:states(name),
            lga:lgas(name),
            ward:wards(name)
        `)
        .neq('role', 'MEMBER')
        .order('full_name', { ascending: true })

    if (error) {
        console.error("Error fetching staff:", error)
        return []
    }

    return data
}

export async function updateStaffAction(targetUserId: string, updates: { role?: string, stateId?: number | null, lgaId?: number | null, wardId?: number | null }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') return { success: false, error: 'Forbidden' }

    const { error } = await supabase
        .from('users')
        .update({
            ...(updates.role ? { role: updates.role } : {}),
            state_id: updates.stateId,
            lga_id: updates.lgaId,
            ward_id: updates.wardId
        })
        .eq('id', targetUserId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/manager')
    revalidatePath('/admin/members')
    return { success: true }
}
