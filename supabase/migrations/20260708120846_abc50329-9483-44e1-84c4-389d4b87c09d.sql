
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS og_image text;

-- Drop policies first (they depend on status column type)
DROP POLICY IF EXISTS "Visible comments are public" ON public.comments;
DROP POLICY IF EXISTS "Users can view own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage comments" ON public.comments;

-- Migrate enum
CREATE TYPE public.comment_status_new AS ENUM ('pending', 'approved', 'hidden');
ALTER TABLE public.comments ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.comments
  ALTER COLUMN status TYPE public.comment_status_new
  USING (CASE status::text WHEN 'visible' THEN 'approved' ELSE 'hidden' END)::public.comment_status_new;
DROP TYPE public.comment_status;
ALTER TYPE public.comment_status_new RENAME TO comment_status;
ALTER TABLE public.comments ALTER COLUMN status SET DEFAULT 'pending'::public.comment_status;

-- Thread + updated_at
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS comments_parent_idx ON public.comments(parent_id);

DROP TRIGGER IF EXISTS comments_set_updated_at ON public.comments;
CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recreate policies
CREATE POLICY "Approved comments are public"
  ON public.comments FOR SELECT
  USING (status = 'approved'::public.comment_status);

CREATE POLICY "Users can view own comments"
  ON public.comments FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all comments"
  ON public.comments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id AND status IN ('pending'::public.comment_status, 'approved'::public.comment_status));

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id AND status <> 'hidden'::public.comment_status)
  WITH CHECK (auth.uid() = author_id AND status <> 'hidden'::public.comment_status);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id AND status <> 'hidden'::public.comment_status);

CREATE POLICY "Admins can manage comments"
  ON public.comments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed demo comments
DO $$
DECLARE
  v_user uuid;
  v_post uuid;
  v_first uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_post FROM public.posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 1;
  IF v_user IS NOT NULL AND v_post IS NOT NULL THEN
    INSERT INTO public.comments (post_id, author_id, body, status)
    VALUES (v_post, v_user, 'Bài viết rõ ràng, cảm ơn tác giả đã chia sẻ góc nhìn trung lập.', 'approved')
    RETURNING id INTO v_first;

    INSERT INTO public.comments (post_id, author_id, parent_id, body, status)
    VALUES (v_post, v_user, v_first, 'Mình cũng đồng ý, phần cảnh báo rủi ro rất cần thiết cho người mới.', 'approved');

    INSERT INTO public.comments (post_id, author_id, body, status)
    VALUES (v_post, v_user, 'Mong tác giả ra thêm bài về bảo mật ví và quản lý khóa riêng tư.', 'pending');
  END IF;
END $$;
