import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const [{ data: posts }, { data: cats }, { data: tags }] = await Promise.all([
          supabase.from("posts").select("slug, updated_at").eq("status", "published"),
          supabase.from("categories").select("slug"),
          supabase.from("tags").select("slug"),
        ]);

        const entries = [
          { loc: "/", priority: "1.0", changefreq: "weekly" },
          { loc: "/blog", priority: "0.9", changefreq: "daily" },
          { loc: "/about", priority: "0.5", changefreq: "monthly" },
          { loc: "/contact", priority: "0.5", changefreq: "monthly" },
          ...(cats ?? []).map((c) => ({ loc: `/category/${c.slug}`, priority: "0.7", changefreq: "weekly" })),
          ...(tags ?? []).map((t) => ({ loc: `/tag/${t.slug}`, priority: "0.5", changefreq: "weekly" })),
          ...(posts ?? []).map((p) => ({
            loc: `/post/${p.slug}`,
            priority: "0.8",
            changefreq: "weekly",
            lastmod: p.updated_at ?? undefined,
          })),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e: any) =>
            [
              "  <url>",
              `    <loc>${BASE_URL}${e.loc}</loc>`,
              e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
              `    <changefreq>${e.changefreq}</changefreq>`,
              `    <priority>${e.priority}</priority>`,
              "  </url>",
            ].filter(Boolean).join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
