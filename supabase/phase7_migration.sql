-- Phase 7 Migration Script

-- Create AI Reports Cache & Limits Table
CREATE TABLE IF NOT EXISTS public.ai_reports_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metrics_snapshot JSONB NOT NULL,
    ai_response JSONB NOT NULL
);

ALTER TABLE public.ai_reports_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read and manage ai reports" ON public.ai_reports_cache 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
    );
