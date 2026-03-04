'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Helper to convert phone to a dummy email for Supabase Auth since we aren't using SMS yet
const getEmailFromPhone = (phone: string) => `${phone}@register.local`

export async function login(formData: FormData) {
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const email = getEmailFromPhone(phone)

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    return redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const stateId = formData.get('state_id') as string
    const lgaId = formData.get('lga_id') as string
    const wardId = formData.get('ward_id') as string
    const pollingUnitId = formData.get('polling_unit_id') as string

    const email = getEmailFromPhone(phone)

    const supabase = await createClient()

    // Sign up using dummy email
    const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (signUpError) {
        return redirect(`/signup?message=${encodeURIComponent(signUpError.message)}`)
    }

    // Insert into public.users
    if (data.user) {
        const { error: dbError } = await supabase.from('users').insert({
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            email: email, // storing dummy email
            state_id: parseInt(stateId),
            lga_id: parseInt(lgaId),
            ward_id: parseInt(wardId),
            polling_unit_id: parseInt(pollingUnitId),
            role: 'MEMBER',
            verified: false,
        })

        if (dbError) {
            // rollback auth user if profile creation fails? (Skipping for MVP, but good practice)
            return redirect(`/signup?message=${encodeURIComponent(dbError.message)}`)
        }
    }

    return redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
}
