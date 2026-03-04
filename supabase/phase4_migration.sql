-- Phase 4 Migration Script

-- 1. Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_state_id ON public.users(state_id);
CREATE INDEX IF NOT EXISTS idx_users_lga_id ON public.users(lga_id);
CREATE INDEX IF NOT EXISTS idx_users_ward_id ON public.users(ward_id);
CREATE INDEX IF NOT EXISTS idx_users_polling_unit_id ON public.users(polling_unit_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_verified ON public.users(verified);

-- Note: Postgres handles these transparently to optimize any WHERE clauses we fire via Supabase.
