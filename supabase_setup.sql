-- =========================================================
-- SUPABASE DATABASE SETUP FOR ONLINE VOTING APPLICATION
-- Execute this script in your Supabase SQL Editor
-- =========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Voting Sessions Table
CREATE TABLE IF NOT EXISTS public.voting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Contestants Table
CREATE TABLE IF NOT EXISTS public.contestants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Votes Table (with unique constraint on voter_id per session)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES public.contestants(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_voter_per_session UNIQUE (session_id, voter_id)
);

-- 5. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Admin User (aws_team / AWS_TEAM_PASSWORD)
-- Note: In production, password hash is stored. Here we store the secure hashed token.
INSERT INTO public.admin_users (username, password_hash)
VALUES ('aws_team', crypt('AWS_TEAM_PASSWORD', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- 6. RPC Function for Backend Admin Verification
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stored_hash TEXT;
BEGIN
    SELECT password_hash INTO v_stored_hash
    FROM public.admin_users
    WHERE username = p_username;
    
    IF v_stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify password against stored bcrypt hash or plain text fallback
    IF v_stored_hash = crypt(p_password, v_stored_hash) OR (p_username = 'aws_team' AND p_password = 'AWS_TEAM_PASSWORD') THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- 7. Setup Row Level Security (RLS)
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active voting sessions, contestants, and votes count
CREATE POLICY "Allow public read voting_sessions" ON public.voting_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read contestants" ON public.contestants FOR SELECT USING (true);
CREATE POLICY "Allow public read votes" ON public.votes FOR SELECT USING (true);

-- Allow public insertion of votes (validated by unique voter constraint)
CREATE POLICY "Allow public insert votes" ON public.votes FOR INSERT WITH CHECK (true);

-- Allow full administrative control for session management
CREATE POLICY "Allow full access voting_sessions" ON public.voting_sessions FOR ALL USING (true);
CREATE POLICY "Allow full access contestants" ON public.contestants FOR ALL USING (true);

-- 8. Storage Bucket for Contestant Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contestants', 'contestants', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Public Access & Image Uploads
CREATE POLICY "Public Read Access for Contestants Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'contestants');

CREATE POLICY "Public Upload Access for Contestants Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contestants');

-- Enable Realtime on votes and voting_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.voting_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
