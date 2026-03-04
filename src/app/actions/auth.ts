'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Helper to convert phone to a dummy email for Supabase Auth since we aren't using SMS yet
const getEmailFromPhone = (phone: string) => `${phone}@register-obidient.com`

export async function login(formData: FormData) {
    const identifier = (formData.get('identifier') as string).trim()
    const password = formData.get('password') as string

    let loginEmail = identifier

    // If it's not a valid email format (doesn't have @), treat as phone
    if (!identifier.includes('@')) {
        // Normalize phone (remove + if present, ensure numeric only, etc. - simple version for now)
        loginEmail = getEmailFromPhone(identifier.replace(/\D/g, ''))
    } else {
        loginEmail = identifier.toLowerCase()
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
    })

    if (error) {
        return redirect(`/login?message=${encodeURIComponent('Could not authenticate user. Please check your credentials.')}`)
    }

    return redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const fullName = formData.get('full_name') as string
    const emailInput = (formData.get('email') as string).toLowerCase().trim()
    const phone = (formData.get('phone') as string).replace(/\D/g, '').trim()
    const password = formData.get('password') as string
    const stateId = formData.get('state_id') as string
    const lgaId = formData.get('lga_id') as string
    const wardId = formData.get('ward_id') as string
    const pollingUnitId = formData.get('polling_unit_id') as string

    // Phase 8 Fields
    const age = parseInt(formData.get('age') as string)
    const isRegisteredVoter = formData.get('is_registered_voter') === 'true'
    const needsRegistrationHelp = formData.get('needs_registration_help') === 'true'

    // Server-side Validation
    const isUnder18 = age < 18

    const supabase = await createClient()

    // 1. Check for duplicate Email or Phone in public.users
    const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, phone')
        .or(`email.eq.${emailInput},phone.eq.${phone}`)
        .single()

    if (existingUser) {
        const field = existingUser.email === emailInput ? 'Email' : 'Phone'
        return redirect(`/signup?message=${encodeURIComponent(`${field} is already registered.`)}`)
    }

    // Logic-driven PU mapping
    let registeredPUId: number | null = null
    let intendedPUId: number | null = null

    if (!isUnder18) {
        if (isRegisteredVoter) {
            registeredPUId = parseInt(pollingUnitId)
        } else {
            intendedPUId = parseInt(pollingUnitId)
        }
    }

    // Adult validation
    if (!isUnder18 && !pollingUnitId) {
        return redirect(`/signup?message=${encodeURIComponent('Please select a polling unit.')}`)
    }

    // Sign up using real email
    const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailInput,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone
            }
        }
    })

    if (signUpError) {
        return redirect(`/signup?message=${encodeURIComponent(signUpError.message)}`)
    }

    // Insert into public.users
    if (data.user) {
        const adminSupabase = await createAdminClient()
        const { error: dbError } = await adminSupabase.from('users').insert({
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            email: emailInput,
            state_id: parseInt(stateId),
            lga_id: parseInt(lgaId),
            ward_id: parseInt(wardId),
            polling_unit_id: parseInt(pollingUnitId), // Primary location reference

            // Phase 8 & 10 Data
            age: age,
            is_under_18: isUnder18,
            is_registered_voter: isUnder18 ? false : isRegisteredVoter,
            needs_registration_help: isUnder18 ? false : needsRegistrationHelp,
            registered_polling_unit_id: registeredPUId,
            intended_polling_unit_id: intendedPUId,

            role: 'MEMBER',
            verified: false,
        })

        if (dbError) {
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

export async function forgotPassword(formData: FormData) {
    const email = (formData.get('email') as string).toLowerCase().trim()
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard/reset-password`,
    })

    if (error) {
        return redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`)
    }

    return redirect('/forgot-password?message=Check your email for the password reset link.')
}

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return redirect(`/dashboard/reset-password?message=${encodeURIComponent(error.message)}`)
    }

    return redirect('/dashboard?message=Password updated successfully')
}
