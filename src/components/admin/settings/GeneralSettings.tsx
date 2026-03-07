'use client'

import { Settings as SettingsIcon } from 'lucide-react'
import { SettingRow, SettingsSection } from './BaseSettings'

export default function GeneralSettings({ settings, onUpdate, isPending }: {
    settings: any[], onUpdate: any, isPending: boolean
}) {
    const generalSettings = settings.filter(s =>
        ['site_name', 'site_description', 'coordinator_info_visible'].includes(s.id)
    )

    return (
        <SettingsSection title="Global Preferences" icon={SettingsIcon}>
            {generalSettings.map(s => (
                <SettingRow key={s.id} item={s} onUpdate={onUpdate} isPending={isPending} />
            ))}
        </SettingsSection>
    )
}
