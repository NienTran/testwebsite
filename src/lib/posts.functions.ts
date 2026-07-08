import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const PostCols =
  "id, slug, title, excerpt, cover_image, reading_time, featured, published_at, view_count, category:categories(id, slug, name), author:profiles!posts_author_profile_fkey(id, display_name, avatar_url), post_tags(tag:tags(id, slug, name))";

export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((raw) =>
    z
      .object({
        limit: z.number().int().positive().max(50).optional(),
        featured: z.boolean().optional(),
        categorySlug: z.string().optional(),
        tagSlug: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["newest", "popular"]).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("posts")
      .select(PostCols)
      .eq("status", "published");

    if (data.featured) q = q.eq("featured", true);
    if (data.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (!cat) return [];
      q = q.eq("category_id", cat.id);
    }
    if (data.tagSlug) {
      const { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", data.tagSlug)
        .maybeSingle();
      if (!tag) return [];
      const { data: pts } = await supabase
        .from("post_tags")
        .select("post_id")
        .eq("tag_id", tag.id);
      const ids = (pts ?? []).map((p) => p.post_id);
      if (ids.length === 0) return [];
      q = q.in("id", ids);
    }
    if (data.search && data.search.trim()) {
      const s = `%${data.search.trim()}%`;
      q = q.or(`title.ilike.${s},excerpt.ilike.${s}`);
    }
    if (data.sort === "popular") q = q.order("view_count", { ascending: false });
    else q = q.order("published_at", { ascending: false });

    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `id, slug, title, excerpt, cover_image, og_image, content, reading_time, published_at, view_count, meta_title, meta_description, canonical_url,
         category:categories(id, slug, name),
         author:profiles!posts_author_profile_fkey(id, display_name, avatar_url, bio),
         post_tags(tag:tags(id, slug, name))`,
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return null;

    const { data: related } = await supabase
      .from("posts")
      .select(PostCols)
      .eq("status", "published")
      .neq("id", post.id)
      .eq("category_id", post.category?.id ?? "")
      .order("published_at", { ascending: false })
      .limit(3);

    const { data: comments } = await supabase
      .from("comments")
      .select("id, body, parent_id, created_at, author:profiles!comments_author_profile_fkey(id, display_name, avatar_url)")
      .eq("post_id", post.id)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    return { post, related: related ?? [], comments: comments ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listTags = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: cat, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return cat;
  });

export const getTagBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: tag, error } = await supabase
      .from("tags")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return tag;
  });

// ---------------- Authenticated actions ----------------

const upsertPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(120),
  excerpt: z.string().max(400).optional().nullable(),
  cover_image: z.string().max(500).optional().nullable(),
  og_image: z.string().max(500).optional().nullable(),
  content: z.string().default(""),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().default(false),
  meta_title: z.string().max(200).optional().nullable(),
  meta_description: z.string().max(400).optional().nullable(),
  canonical_url: z.string().max(400).optional().nullable(),
  reading_time: z.number().int().positive().max(120).default(3),
  tag_ids: z.array(z.string().uuid()).default([]),
});

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => upsertPostSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: isAuthor } = await supabase.rpc("has_role", { _user_id: userId, _role: "author" });
    if (!isAdmin && !isAuthor) throw new Error("Bạn không có quyền đăng bài.");

    const { tag_ids, id, ...rest } = data;
    const payload = {
      ...rest,
      author_id: userId,
      published_at: rest.status === "published" ? new Date().toISOString() : null,
    };
    let postId = id;
    if (id) {
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await supabase
        .from("posts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      postId = inserted.id;
    }
    if (postId) {
      await supabase.from("post_tags").delete().eq("post_id", postId);
      if (tag_ids.length > 0) {
        await supabase
          .from("post_tags")
          .insert(tag_ids.map((tag_id) => ({ post_id: postId!, tag_id })));
      }
    }
    return { id: postId };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    let q = supabase
      .from("posts")
      .select("id, title, slug, status, featured, published_at, updated_at, category:categories(name)")
      .order("updated_at", { ascending: false });
    if (!isAdmin) q = q.eq("author_id", userId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPostForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.supabase
      .from("posts")
      .select("*, post_tags(tag_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return post;
  });
