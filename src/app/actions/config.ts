'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAppSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') return []

    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('id', { ascending: true })

    if (error) {
        console.error("Error fetching settings:", error)
        return []
    }

    return data
}

export async function updateAppSetting(id: string, value: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') return { success: false, error: 'Forbidden' }

    const { error } = await supabase
        .from('app_settings')
        .update({
            value: value,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings')
    return { success: true }
}

// Utility for server-side code to fetch settings efficiently
export async function getInternalSetting(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('app_settings').select('value').eq('id', id).single()
    return data?.value || null
}
