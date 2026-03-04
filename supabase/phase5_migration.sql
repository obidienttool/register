-- Phase 5 Migration Script

-- Create SMS Logs Table
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sent_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    target_scope JSONB,
    total_recipients INT NOT NULL DEFAULT 0,
    api_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Allow reading logs for dashboard/analytics
-- Admins can view all, Coordinators can only view their own logs
CREATE POLICY "Admin select sms_logs" ON public.sms_logs 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        )
    );

CREATE POLICY "Coordinator select sms_logs" ON public.sms_logs 
    FOR SELECT USING (
        sent_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('STATE_COORDINATOR', 'LGA_COORDINATOR', 'WARD_COORDINATOR')
        )
    );
