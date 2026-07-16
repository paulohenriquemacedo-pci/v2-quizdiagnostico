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