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