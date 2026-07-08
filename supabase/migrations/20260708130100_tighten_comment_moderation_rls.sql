-- Tighten comment moderation so normal users cannot bypass the dashboard.
-- This keeps all newly submitted comments in `pending` until an admin approves them.

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can submit pending comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'pending'::public.comment_status
  );

-- There is no public UI for editing comments yet. Dropping this policy prevents users
-- from directly changing their own comment status via the Supabase client.
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;

-- Basic integrity: a comment cannot be its own parent.
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_parent_not_self;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id);

-- Keep replies inside the same post and limit nesting to one reply level.
CREATE OR REPLACE FUNCTION public.validate_comment_parent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.comments parent
      WHERE parent.id = NEW.parent_id
        AND parent.post_id = NEW.post_id
        AND parent.parent_id IS NULL
    ) THEN
      RAISE EXCEPTION 'Invalid parent comment';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_comment_parent_trigger ON public.comments;
CREATE TRIGGER validate_comment_parent_trigger
  BEFORE INSERT OR UPDATE OF parent_id, post_id ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent();

REVOKE ALL ON FUNCTION public.validate_comment_parent() FROM PUBLIC, anon, authenticated;
