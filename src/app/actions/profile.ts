'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const photoUrl = formData.get('photoUrl') as string

    if (!fullName || !phone) {
        return { success: false, error: 'Name and Phone are required.' }
    }

    const { error } = await supabase
        .from('users')
        .update({
            full_name: fullName,
            phone: phone,
            ...(photoUrl ? { photo_url: photoUrl } : {})
        })
        .eq('id', user.id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/profile')

    return { success: true }
}
