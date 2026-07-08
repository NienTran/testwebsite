
-- Restrict trigger function; it only needs to run as owner via the trigger
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role is called from RLS by callers; keep execute for anon & authenticated so policies work
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- Tighten newsletter / contact_messages inserts with minimal sanity checks
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email IS NOT NULL AND length(email) BETWEEN 3 AND 200 AND email LIKE '%@%');

DROP POLICY IF EXISTS "Anyone can send contact" ON public.contact_messages;
CREATE POLICY "Anyone can send contact" ON public.contact_messages
  FOR INSERT WITH CHECK (
    name IS NOT NULL AND length(name) BETWEEN 1 AND 200 AND
    email IS NOT NULL AND length(email) BETWEEN 3 AND 200 AND email LIKE '%@%' AND
    message IS NOT NULL AND length(message) BETWEEN 1 AND 4000
  );
