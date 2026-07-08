import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z
      .object({
        post_id: z.string().uuid(),
        body: z.string().trim().min(2).max(2000),
        parent_id: z.string().uuid().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("comments")
      .insert({
        post_id: data.post_id,
        body: data.body,
        parent_id: data.parent_id ?? null,
        author_id: context.userId,
        status: "pending",
      })
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, status: inserted.status };
  });

export const listAllComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z
      .object({
        status: z.enum(["all", "pending", "approved", "hidden"]).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    let q = supabase
      .from("comments")
      .select(
        "id, body, status, parent_id, created_at, author:profiles!comments_author_profile_fkey(display_name), post:posts(title, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const moderateComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "hide", "delete"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (data.action === "delete") {
      const { error } = await supabase.from("comments").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const status = data.action === "hide" ? "hidden" : "approved";
      const { error } = await supabase.from("comments").update({ status }).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
