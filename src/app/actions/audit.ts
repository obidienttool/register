'use server'

import { createClient } from '@/utils/supabase/server'

export async function logAuditEvent(action: string, metadata: any = {}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from('system_audit_logs').insert({
        user_id: user.id,
        action,
        metadata
    })

    if (error) {
        console.error("Audit Log Error:", error)
        return false
    }

    return true
}
