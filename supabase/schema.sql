-- Drop existing tables to start fresh (for dev purposes, skip in prod)
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.polling_units CASCADE;
DROP TABLE IF EXISTS public.wards CASCADE;
DROP TABLE IF EXISTS public.lgas CASCADE;
DROP TABLE IF EXISTS public.states CASCADE;

-- 1. States Table
CREATE TABLE public.states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Local Government Areas (LGAs) Table
CREATE TABLE public.lgas (
    id SERIAL PRIMARY KEY,
    state_id INT NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    UNIQUE(state_id, name)
);

-- 3. Wards Table
CREATE TABLE public.wards (
    id SERIAL PRIMARY KEY,
    lga_id INT NOT NULL REFERENCES public.lgas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    UNIQUE(lga_id, name)
);

-- 4. Polling Units Table
CREATE TABLE public.polling_units (
    id SERIAL PRIMARY KEY,
    ward_id INT NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Optional PU Code like '01'
    UNIQUE(ward_id, name)
);

-- 5. Users Profile Table (Extending Supabase Auth users)
-- Instead of using Supabase Auth users directly for our complex profile, we create a public table linked to auth.users.
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    state_id INT REFERENCES public.states(id),
    lga_id INT REFERENCES public.lgas(id),
    ward_id INT REFERENCES public.wards(id),
    polling_unit_id INT REFERENCES public.polling_units(id),
    role VARCHAR(50) DEFAULT 'MEMBER' NOT NULL,
    verified BOOLEAN DEFAULT false NOT NULL,
    membership_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS)
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to location hierarchy
CREATE POLICY "Public Location Read" ON public.states FOR SELECT USING (true);
CREATE POLICY "Public Location Read" ON public.lgas FOR SELECT USING (true);
CREATE POLICY "Public Location Read" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Public Location Read" ON public.polling_units FOR SELECT USING (true);

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own phone and email
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Seed Sample Hierarchy Data
INSERT INTO public.states (id, name) VALUES (1, 'Lagos');
INSERT INTO public.lgas (id, state_id, name) VALUES (1, 1, 'Eti-Osa');
INSERT INTO public.wards (id, lga_id, name) VALUES (1, 1, 'Ikoyi');
INSERT INTO public.polling_units (id, ward_id, name, code) VALUES (1, 1, 'PU 001 - Bour Bourdillon', '001');
INSERT INTO public.polling_units (id, ward_id, name, code) VALUES (2, 1, 'PU 002 - Falomo', '002');
-- Fix sequences to avoid duplicate keys when inserting from UI
SELECT setval('public.states_id_seq', (SELECT MAX(id) FROM public.states));
SELECT setval('public.lgas_id_seq', (SELECT MAX(id) FROM public.lgas));
SELECT setval('public.wards_id_seq', (SELECT MAX(id) FROM public.wards));
SELECT setval('public.polling_units_id_seq', (SELECT MAX(id) FROM public.polling_units));

-- Trigger to create a public.user profile on sign_up (optional, but since we are capturing names, we will insert manually via transaction-like server action)
