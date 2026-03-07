'use server'

import { createClient } from '@/utils/supabase/server'
import { MemberFilters, buildScopedMembersQuery } from '@/lib/member-queries'
import { sendEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function broadcastEmailAction(filters: MemberFilters, subject: string, message: string) {
    const supabase = await createClient()

    // Auth Verify
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Message validation
    if (!subject || subject.trim().length === 0) {
        return { success: false, error: 'Subject cannot be empty.' }
    }
    if (!message || message.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty.' }
    }

    // Get Target Audience
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
    const emails = finalTargets.map((t: any) => t.email).filter(Boolean)
    if (emails.length === 0) {
        return { success: false, error: 'Matched users do not have valid email addresses.' }
    }

    // Call Resend Library
    // Note: This sends as a single multi-recipient email. 
    // For individual tracking/personalization, Resend Batch API should be used.
    const apiResponse = await sendEmail({
        to: emails,
        subject: subject,
        html: `<div style="font-family: sans-serif; line-height: 1.5; color: #333;">${message.replace(/\n/g, '<br>')}</div>`
    })

    // Log the request (Optional: you might want an email_logs table)
    /*
    const { error: logError } = await supabase.from('email_logs').insert({
        sent_by: user.id,
        subject: subject,
        message: message,
        target_scope: filters || {},
        total_recipients: emails.length,
        api_response: apiResponse
    })
    */

    if (!apiResponse.success && apiResponse.error) {
        return { success: false, error: apiResponse.error }
    }

    revalidatePath('/admin/email')

    return { success: true, recipientsCount: emails.length }
}
