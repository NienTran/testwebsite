import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/site-layout";
import { PostCard } from "@/components/blog/post-card";
import { getTagBySlug, listPublishedPosts } from "@/lib/posts.functions";

export const Route = createFileRoute("/tag/$slug")({
  loader: async ({ params }) => {
    const tag = await getTagBySlug({ data: { slug: params.slug } });
    if (!tag) throw notFound();
    const posts = await listPublishedPosts({ data: { tagSlug: params.slug } as any });
    return { tag, posts };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Thẻ không tồn tại" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `#${loaderData.tag.name} — Mikan Money Blog` },
        { name: "description", content: `Các bài viết với thẻ #${loaderData.tag.name}.` },
        { property: "og:url", content: `/tag/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/tag/${params.slug}` }],
    };
  },
  component: TagPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Thẻ không tồn tại</h1>
        <Link to="/blog" className="mt-4 inline-block text-accent hover:underline">Quay lại</Link>
      </div>
    </SiteLayout>
  ),
});

function TagPage() {
  const { tag, posts } = Route.useLoaderData();
  return (
    <SiteLayout>
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Thẻ</p>
          <h1 className="mt-2 font-serif text-4xl">#{tag.name}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bài viết nào cho thẻ này.</p>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p: any) => <PostCard key={p.slug} post={p} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
