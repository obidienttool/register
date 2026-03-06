'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, UserCircle } from 'lucide-react'

interface PhotoUploadProps {
    currentPhotoUrl?: string
    onUploadSuccess: (url: string) => void
}

export default function PhotoUpload({ currentPhotoUrl, onUploadSuccess }: PhotoUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Create local preview
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to member-photos bucket
            const { error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('member-photos')
                .getPublicUrl(filePath)

            onUploadSuccess(publicUrl)
        } catch (error: any) {
            console.error('Upload error:', error)
            alert('Error uploading photo: ' + error.message)
            setPreviewUrl(currentPhotoUrl)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle className="w-20 h-20 text-slate-300" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-green-600 text-white p-2.5 rounded-full shadow-lg hover:bg-green-700 transition-all active:scale-90"
                >
                    <Camera className="w-5 h-5" />
                </button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Identity Photo</p>
        </div>
    )
}
