import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RoleSchema = z.enum(["admin", "author", "user"]);

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.role as string);
  });

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const byUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) =>
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role as string]),
    );
    return (profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: RoleSchema,
        add: z.boolean(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (data.add) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const filter = (q: any) => (isAdmin ? q : q.eq("author_id", userId));
    const [posts, drafts, published] = await Promise.all([
      filter(supabase.from("posts").select("id", { count: "exact", head: true })),
      filter(supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft")),
      filter(supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published")),
    ]);
    const comments = await supabase.from("comments").select("id", { count: "exact", head: true });
    const users = isAdmin
      ? await supabase.from("profiles").select("id", { count: "exact", head: true })
      : { count: 0 };
    return {
      totalPosts: posts.count ?? 0,
      draftPosts: drafts.count ?? 0,
      publishedPosts: published.count ?? 0,
      totalComments: comments.count ?? 0,
      totalUsers: users.count ?? 0,
      isAdmin: Boolean(isAdmin),
    };
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ post_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", userId)
      .eq("post_id", data.post_id)
      .maybeSingle();
    if (existing) {
      await supabase.from("bookmarks").delete().eq("user_id", userId).eq("post_id", data.post_id);
      return { bookmarked: false };
    }
    await supabase.from("bookmarks").insert({ user_id: userId, post_id: data.post_id });
    return { bookmarked: true };
  });

export const listMyBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookmarks")
      .select("post:posts(id, slug, title, excerpt, cover_image, published_at, reading_time, category:categories(name, slug))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.post).filter(Boolean);
  });
