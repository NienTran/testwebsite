import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/layout/site-layout";
import { PostCard } from "@/components/blog/post-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listPublishedPosts, listCategories, listTags } from "@/lib/posts.functions";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["newest", "popular"]).optional(),
});

export const Route = createFileRoute("/blog")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Tất cả bài viết — Mikan Money Blog" },
      { name: "description", content: "Tìm và đọc mọi bài viết trên Mikan Money Blog." },
      { property: "og:title", content: "Tất cả bài viết — Mikan Money Blog" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogListPage,
});

function BlogListPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const postsFn = useServerFn(listPublishedPosts);
  const catsFn = useServerFn(listCategories);
  const tagsFn = useServerFn(listTags);

  const { data: posts = [], isFetching } = useQuery({
    queryKey: ["posts", "list", search],
    queryFn: () =>
      postsFn({
        data: {
          search: search.q,
          categorySlug: search.category,
          tagSlug: search.tag,
          sort: search.sort ?? "newest",
        } as any,
      }),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => catsFn() });
  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: () => tagsFn() });

  const update = (patch: any) =>
    navigate({ search: ((prev: any) => ({ ...prev, ...patch })) as any, replace: true });

  return (
    <SiteLayout>
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h1 className="font-serif text-4xl">Bài viết</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Duyệt tất cả nội dung, lọc theo chuyên mục hoặc thẻ.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: q || undefined });
            }}
            className="mt-6 flex flex-col gap-3 md:flex-row"
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo từ khóa..."
              className="md:max-w-sm"
            />
            <Select
              value={search.category ?? "__all"}
              onValueChange={(v) => update({ category: v === "__all" ? undefined : v })}
            >
              <SelectTrigger className="md:w-56"><SelectValue placeholder="Chuyên mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Tất cả chuyên mục</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={search.sort ?? "newest"}
              onValueChange={(v) => update({ sort: v })}
            >
              <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="popular">Xem nhiều</SelectItem>
              </SelectContent>
            </Select>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t: any) => {
              const active = search.tag === t.slug;
              return (
                <button
                  key={t.slug}
                  onClick={() => update({ tag: active ? undefined : t.slug })}
                  type="button"
                >
                  <Badge
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer rounded-sm font-normal"
                  >
                    #{t.name}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        {isFetching && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        {!isFetching && posts.length === 0 && (
          <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
            Không có bài viết nào phù hợp.
            <div className="mt-3">
              <Link to="/blog" className="text-accent hover:underline">Xóa bộ lọc</Link>
            </div>
          </div>
        )}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p: any) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
