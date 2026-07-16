-- Add missing columns for complete quiz data
ALTER TABLE public.quiz_responses 
ADD COLUMN IF NOT EXISTS dominant_code text,
ADD COLUMN IF NOT EXISTS dominant_intensity text;

-- Add comment for documentation
COMMENT ON COLUMN public.quiz_responses.dominant_code IS 'Profile code: A, B, C, D, E, or F';
COMMENT ON COLUMN public.quiz_responses.dominant_intensity IS 'Intensity level: Muito Forte, Forte, Moderado, Leve, Ausente';