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