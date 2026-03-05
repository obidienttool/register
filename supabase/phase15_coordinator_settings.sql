-- Phase 15 Migration: Coordinator Contact Visibility Settings

-- Insert visibility toggles into app_settings
INSERT INTO public.app_settings (id, value, description, is_secret)
VALUES 
    ('show_ward_coordinator_info', 'true', 'Show Ward Coordinator name and phone on member dashboards', false),
    ('show_state_coordinator_info', 'true', 'Show State Coordinator name and phone on member dashboards', false)
ON CONFLICT (id) DO UPDATE SET 
    description = EXCLUDED.description;
