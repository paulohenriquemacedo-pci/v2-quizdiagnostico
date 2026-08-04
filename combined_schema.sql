-- Create table for quiz submissions
CREATE TABLE public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  answers INTEGER[] NOT NULL,
  scores JSONB NOT NULL,
  dominant_profile TEXT NOT NULL,
  dominant_score INTEGER NOT NULL,
  dominant_intensity TEXT NOT NULL,
  secondary_profiles JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting (anyone can submit)
CREATE POLICY "Anyone can insert quiz submissions"
ON public.quiz_submissions
FOR INSERT
WITH CHECK (true);

-- Create policy for selecting (only backend/admin can read - no direct public access)
CREATE POLICY "No public read access"
ON public.quiz_submissions
FOR SELECT
USING (false);
-- Drop old table if exists
DROP TABLE IF EXISTS public.quiz_submissions;

-- Create new quiz_responses table with complete structure
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  answers JSONB NOT NULL,
  score_perfeccionista INTEGER NOT NULL DEFAULT 0,
  score_multitarefa INTEGER NOT NULL DEFAULT 0,
  score_procrastinador INTEGER NOT NULL DEFAULT 0,
  score_analista INTEGER NOT NULL DEFAULT 0,
  score_dependente INTEGER NOT NULL DEFAULT 0,
  score_sobrecarregado INTEGER NOT NULL DEFAULT 0,
  dominant_profile TEXT NOT NULL,
  dominant_score INTEGER NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  brevo_synced BOOLEAN NOT NULL DEFAULT false,
  brevo_contact_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting (public quiz - anyone can submit)
CREATE POLICY "Anyone can insert quiz responses"
ON public.quiz_responses
FOR INSERT
WITH CHECK (true);

-- Create policy for selecting (no direct public access)
CREATE POLICY "No public read access"
ON public.quiz_responses
FOR SELECT
USING (false);
-- Add missing columns for complete quiz data
ALTER TABLE public.quiz_responses 
ADD COLUMN IF NOT EXISTS dominant_code text,
ADD COLUMN IF NOT EXISTS dominant_intensity text;

-- Add comment for documentation
COMMENT ON COLUMN public.quiz_responses.dominant_code IS 'Profile code: A, B, C, D, E, or F';
COMMENT ON COLUMN public.quiz_responses.dominant_intensity IS 'Intensity level: Muito Forte, Forte, Moderado, Leve, Ausente';
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Only admins can delete roles  
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add comment explaining the table
COMMENT ON TABLE public.user_roles IS 'Stores user roles for RBAC. Admin users can access the admin panel.';
-- Tabela para rastrear cliques no CTA
CREATE TABLE public.cta_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_response_id UUID REFERENCES public.quiz_responses(id),
  email TEXT,
  dominant_profile TEXT,
  dominant_code TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for anonymous quiz users)
CREATE POLICY "Anyone can insert CTA clicks"
ON public.cta_clicks
FOR INSERT
WITH CHECK (true);

-- Only admins can view clicks
CREATE POLICY "Admins can view CTA clicks"
ON public.cta_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
-- Add explicit DENY policies for defense-in-depth

-- For quiz_responses: Explicitly deny updates and deletes from clients
CREATE POLICY "No updates to quiz responses"
ON public.quiz_responses
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "No deletes from quiz responses"
ON public.quiz_responses
FOR DELETE
USING (false);

-- For cta_clicks: Explicitly deny updates and deletes from clients  
CREATE POLICY "No updates to CTA clicks"
ON public.cta_clicks
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "No deletes from CTA clicks"
ON public.cta_clicks
FOR DELETE
USING (false);

-- For user_roles: Allow admins to update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Create table to track quiz starts for funnel metrics
CREATE TABLE public.quiz_starts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT
);

-- Enable RLS
ALTER TABLE public.quiz_starts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous quiz starts)
CREATE POLICY "Anyone can insert quiz starts"
ON public.quiz_starts
FOR INSERT
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view quiz starts"
ON public.quiz_starts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

-- No updates or deletes
CREATE POLICY "No updates to quiz starts"
ON public.quiz_starts
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "No deletes from quiz starts"
ON public.quiz_starts
FOR DELETE
USING (false);
ALTER TABLE public.quiz_responses
  DROP COLUMN brevo_synced,
  DROP COLUMN brevo_contact_id;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _user_id = (SELECT auth.uid())
        OR (SELECT auth.role()) = 'service_role'
      )
  )
$$;
ALTER TABLE public.quiz_responses ADD COLUMN IF NOT EXISTS research_phase TEXT;
