import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/site-layout";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listPublishedPosts, listCategories, listTags } from "@/lib/posts.functions";
import { subscribeNewsletter } from "@/lib/marketing.functions";
import { ArrowRight, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "description", content: SITE.description },
      { property: "og:title", content: SITE.name },
      { property: "og:description", content: SITE.description },
      { property: "og:url", content: "/" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const latestFn = useServerFn(listPublishedPosts);
  const catsFn = useServerFn(listCategories);
  const tagsFn = useServerFn(listTags);
  const subFn = useServerFn(subscribeNewsletter);

  const { data: latest = [] } = useQuery({
    queryKey: ["posts", "latest"],
    queryFn: () => latestFn({ data: { limit: 6 } as any }),
  });
  const { data: featured = [] } = useQuery({
    queryKey: ["posts", "featured"],
    queryFn: () => latestFn({ data: { limit: 3, featured: true } as any }),
  });
  const { data: popular = [] } = useQuery({
    queryKey: ["posts", "popular"],
    queryFn: () => latestFn({ data: { limit: 4, sort: "popular" } as any }),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => catsFn() });
  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: () => tagsFn() });

  const [email, setEmail] = useState("");
  const subscribe = useMutation({
    mutationFn: (e: string) => subFn({ data: { email: e } }),
    onSuccess: () => {
      toast.success("Đã đăng ký nhận bản tin.");
      setEmail("");
    },
    onError: (e: any) => toast.error(e.message ?? "Không thể đăng ký."),
  });

  const [heroPost, ...restFeatured] = featured;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-secondary/30 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" />
              静けさ · Blog đọc chậm, viết cẩn trọng
            </div>
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              Kiến thức số, công nghệ & tài chính<br />
              <span className="text-accent">trong không gian tĩnh lặng.</span>
            </h1>
            <p className="mt-6 text-base text-muted-foreground md:text-lg">
              Nơi chia sẻ trung lập, có trách nhiệm về kỹ năng số, học tập online, blockchain,
              airdrop, mẹo công nghệ và tài chính cá nhân — không hứa hẹn lợi nhuận, không cường điệu.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/blog">Khám phá bài viết</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">Về Mikan</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {heroPost && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl">Nổi bật</h2>
              <p className="text-sm text-muted-foreground">Những bài viết được biên tập lựa chọn.</p>
            </div>
            <Link to="/blog" className="text-sm text-accent hover:underline">
              Tất cả →
            </Link>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <PostCard post={heroPost as any} />
            <div className="grid gap-6">
              {restFeatured.map((p: any) => (
                <PostCard key={p.slug} post={p} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="border-t bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 font-serif text-3xl">Chuyên mục</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c: any) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="group"
              >
                <Card className="h-full border-border bg-card p-6 transition-colors group-hover:border-accent">
                  <div className="font-serif text-xl group-hover:text-accent">{c.name}</div>
                  {c.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-xs text-accent">
                    Đọc chuyên mục <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-3xl">Mới nhất</h2>
          <Link to="/blog" className="text-sm text-accent hover:underline">Xem tất cả →</Link>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((p: any) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      {/* Popular + Tags */}
      <section className="border-t bg-secondary/20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="mb-6 font-serif text-2xl">Đọc nhiều</h2>
            <ol className="space-y-4">
              {popular.map((p: any, i: number) => (
                <li key={p.slug} className="flex gap-4 border-b pb-4">
                  <span className="font-serif text-3xl text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <Link
                      to="/post/$slug"
                      params={{ slug: p.slug }}
                      className="font-serif text-lg hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.category?.name}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside>
            <h2 className="mb-4 font-serif text-2xl">Thẻ</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((t: any) => (
                <Link key={t.slug} to="/tag/$slug" params={{ slug: t.slug }}>
                  <Badge variant="outline" className="cursor-pointer rounded-sm font-normal hover:border-accent hover:text-accent">
                    #{t.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="font-serif text-3xl">Bản tin hàng tuần</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Một email mỗi tuần — chọn lọc bài viết đáng đọc, không quảng cáo, hủy đăng ký bất cứ lúc nào.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) subscribe.mutate(email);
          }}
          className="mx-auto mt-6 flex max-w-md gap-2"
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@vidu.com"
          />
          <Button type="submit" disabled={subscribe.isPending}>
            Đăng ký
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
