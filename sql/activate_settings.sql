-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category TEXT
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (Admins only)
CREATE POLICY "Admins can see all settings" 
ON public.app_settings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update settings" 
ON public.app_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Seed Initial Settings
INSERT INTO public.app_settings (id, value, description, is_secret, category) VALUES
-- General
('site_name', 'Obidient Connect', 'The display name of the application', false, 'general'),
('site_description', 'Official portal for Obidients in Nigeria', 'The strap-line for the app', false, 'general'),
('coordinator_info_visible', 'true', 'Whether members can see coordinator contact details', false, 'general'),

-- Communication: Resend
('resend_api_key', '', 'API Key for Resend email service', true, 'communication'),
('resend_from_email', 'noreply@obidient.org', 'Verified sender email for Resend', false, 'communication'),

-- Communication: Termii
('sms_api_key', '', 'API Key for Termii SMS service', true, 'communication'),
('sms_sender_id', 'OBIDIENT', 'Registered Sender ID for Termii', false, 'communication'),

-- AI Intelligence
('ai_provider', 'openai', 'Active AI provider (openai, anthropic, etc.)', false, 'ai'),
('ai_model', 'gpt-4o', 'Active AI model identifier', false, 'ai'),
('ai_system_instructions', 'You are an AI assistant for the Obidient community. You are patriotic, respectful, and helpful.', 'The system prompt for AI behavior', false, 'ai'),
('openai_api_key', '', 'Secret token for OpenAI', true, 'ai'),
('anthropic_api_key', '', 'Secret token for Anthropic', true, 'ai'),
('groq_api_key', '', 'Secret token for Groq AI', true, 'ai'),
('xai_api_key', '', 'Secret token for xAI (Grok)', true, 'ai'),

-- Feature Modules
('feature_directory_enabled', 'true', 'Enable the Members Directory', false, 'features'),
('feature_sms_enabled', 'true', 'Enable SMS Broadcast functionality', false, 'features'),
('feature_email_enabled', 'true', 'Enable Email Broadcast functionality', false, 'features')
ON CONFLICT (id) DO NOTHING;
