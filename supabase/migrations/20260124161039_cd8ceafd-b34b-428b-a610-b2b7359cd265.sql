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