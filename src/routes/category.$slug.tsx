import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/site-layout";
import { PostCard } from "@/components/blog/post-card";
import { getCategoryBySlug, listPublishedPosts } from "@/lib/posts.functions";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const category = await getCategoryBySlug({ data: { slug: params.slug } });
    if (!category) throw notFound();
    const posts = await listPublishedPosts({ data: { categorySlug: params.slug } as any });
    return { category, posts };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy chuyên mục" }, { name: "robots", content: "noindex" }] };
    const { category } = loaderData;
    return {
      meta: [
        { title: `${category.name} — Mikan Money Blog` },
        { name: "description", content: category.description ?? `Chuyên mục ${category.name}.` },
        { property: "og:title", content: category.name },
        { property: "og:url", content: `/category/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/category/${params.slug}` }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Chuyên mục không tồn tại</h1>
        <Link to="/blog" className="mt-4 inline-block text-accent hover:underline">Quay lại</Link>
      </div>
    </SiteLayout>
  ),
});

function CategoryPage() {
  const { category, posts } = Route.useLoaderData();
  return (
    <SiteLayout>
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Chuyên mục</p>
          <h1 className="mt-2 font-serif text-4xl">{category.name}</h1>
          {category.description && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bài viết trong chuyên mục này.</p>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p: any) => <PostCard key={p.slug} post={p} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
