export type MemberFilters = {
    stateId?: number;
    lgaId?: number;
    wardId?: number;
    puId?: number;
    role?: string;
    verified?: string; // 'yes' | 'no' | ''
    puTeamMember?: string; // 'yes' | 'no' | ''
    search?: string;
}

/**
 * Note: This must return a raw PostgREST query builder.
 * If this were in a 'use server' file, it would HAVE to be async,
 * but 'await'ing it would trigger the query immediately.
 * By moving it here (no 'use server'), we can keep it synchronous
 * and let the caller add .order() or .limit() before awaiting.
 */
export function buildScopedMembersQuery(supabase: any, profile: any, filters?: MemberFilters) {
    if (!profile) return null

    // Determine if we need an inner join for pu_team_members (only when filtering for 'yes')
    const joinPuTeam = filters?.puTeamMember === 'yes' ? '!inner' : ''

    const query = supabase.from('users').select(`
        *,
        state:states!state_id(name),
        lga:lgas!lga_id(name),
        ward:wards!ward_id(name),
        polling_unit:polling_units!polling_unit_id(name, code),
        pu_team:pu_team_members!user_id${joinPuTeam}(role_title)
    `)

    // Apply RBAC filters
    if (profile.role === 'WARD_COORDINATOR') {
        query.eq('ward_id', profile.ward_id)
    } else if (profile.role === 'LGA_COORDINATOR') {
        query.eq('lga_id', profile.lga_id)
    } else if (profile.role === 'STATE_COORDINATOR') {
        query.eq('state_id', profile.state_id)
    } else if (profile.role !== 'ADMIN') {
        return null // Unauthorized
    }

    // Apply Location filters
    if (filters?.stateId) query.eq('state_id', filters.stateId)
    if (filters?.lgaId) query.eq('lga_id', filters.lgaId)
    if (filters?.wardId) query.eq('ward_id', filters.wardId)
    if (filters?.puId) query.eq('polling_unit_id', filters.puId)

    // Apply Advanced filters
    if (filters?.role) query.eq('role', filters.role)
    if (filters?.verified === 'yes') query.eq('verified', true)
    if (filters?.verified === 'no') query.eq('verified', false)

    // Apply Search
    if (filters?.search) {
        query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    return query
}
