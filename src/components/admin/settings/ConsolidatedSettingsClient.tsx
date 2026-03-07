'use client'

import { useState, useTransition } from 'react'
import { updateAppSetting } from '@/app/actions/config'
import SettingsTabs from './SettingsTabs'
import GeneralSettings from './GeneralSettings'
import AISettings from './AISettings'
import CommunicationSettings from './CommunicationSettings'
import FeatureSettings from './FeatureSettings'

export default function ConsolidatedSettingsClient({ initialSettings }: { initialSettings: any[] }) {
    const [settings, setSettings] = useState(initialSettings)
    const [isPending, startTransition] = useTransition()

    const onUpdate = async (id: string, value: string) => {
        startTransition(async () => {
            const res = await updateAppSetting(id, value)
            if (res.success) {
                setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s))
            } else {
                alert(res.error || 'Failed to update setting')
            }
        })
    }

    return (
        <SettingsTabs>
            {(activeTab) => (
                <div className="max-w-4xl">
                    {activeTab === 'general' && (
                        <GeneralSettings settings={settings} onUpdate={onUpdate} isPending={isPending} />
                    )}
                    {activeTab === 'ai' && (
                        <AISettings settings={settings} onUpdate={onUpdate} isPending={isPending} />
                    )}
                    {activeTab === 'communication' && (
                        <CommunicationSettings settings={settings} onUpdate={onUpdate} isPending={isPending} />
                    )}
                    {activeTab === 'features' && (
                        <FeatureSettings settings={settings} onUpdate={onUpdate} isPending={isPending} />
                    )}
                </div>
            )}
        </SettingsTabs>
    )
}
