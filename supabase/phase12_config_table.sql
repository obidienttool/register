-- Phase 12 Migration Script: System Configuration Table

-- 1. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    is_secret BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Restricted to ADMIN)
CREATE POLICY "Admins can manage app_settings" ON public.app_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        )
    );

-- 4. Seed Initial Settings
INSERT INTO public.app_settings (id, value, description, is_secret)
VALUES 
    ('ai_provider', 'openai', 'Current AI provider (openai or grok)', false),
    ('openai_model', 'gpt-4o-mini', 'OpenAI model name', false),
    ('grok_model', 'grok-beta', 'xAI Grok model name', false),
    ('ai_system_instructions', 'You are a High-Level Strategic Intelligence Advisor for a regional political mobilization network. You will be provided with aggregated structural metrics mapping member verifications, geographic densities, polling unit structures, and SMS activity. Please analyze the data and return an intelligent operational report in strictly valid JSON format exactly matching the following schema: { "strengths": ["...", "..."], "weaknesses": ["...", "..."], "risk_alerts": ["...", "..."], "recommended_actions": ["...", "..."], "suggested_sms_copy": "..." }', 'The system instructions (prompt) for the AI intelligence engine', false)
ON CONFLICT (id) DO NOTHING;

-- Backfill keys if environment variables were available (Optional/Manual in UI later)
INSERT INTO public.app_settings (id, value, description, is_secret)
VALUES 
    ('openai_api_key', '', 'OpenAI API Key', true),
    ('xai_api_key', '', 'xAI / Grok API Key', true),
    ('termii_api_key', '', 'Termii SMS API Key', true)
ON CONFLICT (id) DO NOTHING;
