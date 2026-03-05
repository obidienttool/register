'use server'

import { createClient } from '@/utils/supabase/server'
import { getScopedMembers } from '@/app/actions/members'
import { MemberFilters, buildScopedMembersQuery } from '@/lib/member-queries'
import { sendSMS } from '@/lib/sms'
import { revalidatePath } from 'next/cache'

export async function checkRateLimit(userId: string) {
    const supabase = await createClient()

    // 3 bulk messages per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Perform raw count using aggregate logic
    const { count, error } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })
        .eq('sent_by', userId)
        .gte('created_at', oneHourAgo)

    if (error) return { limitReached: true, count: 0 }

    return { limitReached: (count || 0) >= 3, count: count || 0 }
}

export async function getBroadcastAudienceCount(filters: MemberFilters) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) return 0

    const query = buildScopedMembersQuery(supabase, profile, filters)
    if (!query) return 0

    const { data } = await query
    if (!data) return 0

    let results = data as any[];
    if (filters.puTeamMember === 'no') {
        results = results.filter((r) => !r.pu_team || r.pu_team.length === 0)
    }

    return results.filter(r => r.phone).length;
}

export async function broadcastSMSAction(filters: MemberFilters, message: string) {
    const supabase = await createClient()

    // Auth Verify
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Rate limit Verify
    const limitStatus = await checkRateLimit(user.id)
    if (limitStatus.limitReached) {
        return { success: false, error: 'Rate limit exceeded: Maximum 3 broadcasts per hour.' }
    }

    // Message validation
    if (!message || message.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty.' }
    }
    if (message.length > 160) {
        return { success: false, error: 'Message exceeds 160 character limit.' }
    }

    // Get Target Audience Limitless
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) return { success: false, error: 'Unauthorized' }

    const query = buildScopedMembersQuery(supabase, profile, filters)
    if (!query) return { success: false, error: 'Unauthorized query scope.' }

    const { data: targets } = await query

    if (!targets || targets.length === 0) {
        return { success: false, error: 'No recipients match the selected filters.' }
    }

    let finalTargets = targets as any[];
    if (filters.puTeamMember === 'no') {
        finalTargets = finalTargets.filter((r) => !r.pu_team || r.pu_team.length === 0)
    }

    // Prepare payload
    const phoneNumbers = finalTargets.map((t: any) => t.phone).filter(Boolean)
    if (phoneNumbers.length === 0) {
        return { success: false, error: 'Matched users do not have valid phone numbers.' }
    }

    // Call API Extractor (Simulated/Real Termii)
    const apiResponse = await sendSMS({ to: phoneNumbers, message })

    // Log the request
    const { error: logError } = await supabase.from('sms_logs').insert({
        sent_by: user.id,
        message: message,
        target_scope: filters || {},
        total_recipients: phoneNumbers.length,
        api_response: apiResponse
    })

    if (logError) {
        console.error("Failed to insert SMS Log:", logError)
    }

    if (!apiResponse.success && apiResponse.error) {
        return { success: false, error: apiResponse.error }
    }

    revalidatePath('/admin/analytics')
    revalidatePath('/admin/sms')

    return { success: true, recipientsCount: phoneNumbers.length }
}

export async function getSmsLogs(limit: number = 5) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sms_logs')
        .select(`
            id, message, total_recipients, created_at,
            sender:users(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        return []
    }
    return data
}
