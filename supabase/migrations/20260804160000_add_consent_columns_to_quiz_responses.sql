-- Add LGPD Privacy and Marketing consent columns to quiz_responses
ALTER TABLE public.quiz_responses
  ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS marketing_consent_text_version TEXT DEFAULT 'v1.0';

COMMENT ON COLUMN public.quiz_responses.privacy_consent IS 'Mandatory privacy consent for LGPD data processing';
COMMENT ON COLUMN public.quiz_responses.privacy_consent_at IS 'Timestamp when privacy consent was given';
COMMENT ON COLUMN public.quiz_responses.privacy_policy_version IS 'Version of privacy policy text displayed';
COMMENT ON COLUMN public.quiz_responses.marketing_consent IS 'Optional consent for marketing communications';
COMMENT ON COLUMN public.quiz_responses.marketing_consent_at IS 'Timestamp when marketing consent was given, or null if refused';
COMMENT ON COLUMN public.quiz_responses.marketing_consent_text_version IS 'Version of marketing consent text displayed';
