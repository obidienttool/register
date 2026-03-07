'use client'

import { Cpu, MessageSquare, Key } from 'lucide-react'
import { SettingRow, SettingsSection } from './BaseSettings'

export default function AISettings({ settings, onUpdate, isPending }: {
    settings: any[], onUpdate: any, isPending: boolean
}) {
    const coreSettings = settings.filter(s => s.id === 'ai_provider' || s.id === 'ai_model')
    const instructSettings = settings.filter(s => s.id === 'ai_system_instructions')
    const keySettings = settings.filter(s => ['openai_api_key', 'anthropic_api_key', 'groq_api_key', 'xai_api_key'].includes(s.id))

    return (
        <div className="space-y-6">
            <SettingsSection title="Intelligence Core" icon={Cpu}>
                {coreSettings.map(s => (
                    <SettingRow key={s.id} item={s} onUpdate={onUpdate} isPending={isPending} />
                ))}
            </SettingsSection>

            <SettingsSection title="Personality & Rules" icon={MessageSquare}>
                {instructSettings.map(s => (
                    <SettingRow key={s.id} item={s} onUpdate={onUpdate} isPending={isPending} isTextArea={true} />
                ))}
            </SettingsSection>

            <SettingsSection title="Secure AI Credentials" icon={Key}>
                {keySettings.map(s => (
                    <SettingRow key={s.id} item={s} onUpdate={onUpdate} isPending={isPending} />
                ))}
            </SettingsSection>
        </div>
    )
}
