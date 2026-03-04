'use server'

import { createClient } from '@/utils/supabase/server'

export async function getStates() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('states').select('*').order('name')
    if (error) throw new Error(error.message)
    return data
}

export async function getLgas(stateId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('lgas').select('*').eq('state_id', stateId).order('name')
    if (error) throw new Error(error.message)
    return data
}

export async function getWards(lgaId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('wards').select('*').eq('lga_id', lgaId).order('name')
    if (error) throw new Error(error.message)
    return data
}

export async function getPollingUnits(wardId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('polling_units').select('*').eq('ward_id', wardId).order('name')
    if (error) throw new Error(error.message)
    return data
}
