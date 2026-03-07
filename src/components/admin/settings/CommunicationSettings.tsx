'use client'

import { Mail, Smartphone } from 'lucide-react'
import { SettingRow, SettingsSection } from './BaseSettings'

export default function CommunicationSettings({ settings, onUpdate, isPending }: {
    settings: any[], onUpdate: any, isPending: boolean
}) {
    const emailSettings = settings.filter(s => s.id.startsWith('resend_'))
    const smsSettings = settings.filter(s => s.id.startsWith('sms_'))

    return (
        <div className="space-y-6">
            <SettingsSection title="Resend Email Service" icon={Mail}>
                {emailSettings.map(s => (
                    <SettingRow key={s.id} item={s} onUpdate={onUpdate} isPending={isPending} />
                ))}
            </SettingsSection>

            <SettingsSection title="Termii SMS Service" icon={Smartphone}>
                {smsSettings.map(s => (
                    <SettingRow key={s.id} item={s} onUpdate={onUpdate} isPending={isPending} />
                ))}
            </SettingsSection>
        </div>
    )
}
