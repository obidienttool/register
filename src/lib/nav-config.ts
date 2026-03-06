import {
    Home, Users, Megaphone,
    BarChart3, BrainCircuit, Landmark,
    ClipboardList, LayoutGrid
} from 'lucide-react'

export const NAV_SECTIONS = [
    {
        title: 'Community',
        items: [
            { name: 'Home', href: '/dashboard', icon: Home },
            { name: 'Members Directory', href: '/directory', icon: Users },
        ]
    },
    {
        title: 'Administration',
        items: [
            { name: 'Manage Network', href: '/admin/members', icon: Users },
            { name: 'Unregistered', href: '/admin/unregistered-members', icon: ClipboardList },
        ]
    },
    {
        title: 'Operations',
        items: [
            { name: 'SMS Broadcast', href: '/admin/sms', icon: Megaphone },
            { name: 'Polling Units', href: '/admin/polling-units', icon: Landmark },
        ]
    },
    {
        title: 'Insights',
        items: [
            { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
            { name: 'AI Intelligence', href: '/admin/intelligence', icon: BrainCircuit },
        ]
    }
]
