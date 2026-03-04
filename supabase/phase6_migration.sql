-- Phase 6 Migration Script

-- 1. System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Seed initial settings
INSERT INTO public.system_settings (key, value) VALUES
('sms_enabled', true),
('signup_enabled', true),
('public_registration_enabled', true)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admin update system settings" ON public.system_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);


-- 2. System Backups
CREATE TABLE IF NOT EXISTS public.system_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    backup_type VARCHAR(50) DEFAULT 'manual',
    data_blob JSONB NOT NULL
);

ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage backups" ON public.system_backups FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);


-- 3. System Updates & Patches
CREATE TABLE IF NOT EXISTS public.system_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_tag VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.system_patches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patch_name VARCHAR(100) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_patches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage updates" ON public.system_updates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admin manage patches" ON public.system_patches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);


-- 4. System Audit Logs
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view audit logs" ON public.system_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "System insert audit logs" ON public.system_audit_logs FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Note: In a real-world scenario, you might also want database triggers 
-- to write to system_audit_logs for critical actions automatically,
-- but doing it via application logic (Server Actions) is valid.
