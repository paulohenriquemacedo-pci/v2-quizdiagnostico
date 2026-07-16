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