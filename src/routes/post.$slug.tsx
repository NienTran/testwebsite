import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/site-layout";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { PostCard } from "@/components/blog/post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getPostBySlug } from "@/lib/posts.functions";
import { createComment } from "@/lib/comments.functions";
import { toggleBookmark } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format";
import { Bookmark, Clock, Share2 } from "lucide-react";

export const Route = createFileRoute("/post/$slug")({
  loader: async ({ params }) => {
    const data = await getPostBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Không tìm thấy" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    const title = post.meta_title ?? post.title;
    const desc = post.meta_description ?? post.excerpt ?? "";
    const url = `/post/${params.slug}`;
    const ogImage = post.og_image ?? post.cover_image ?? null;
    return {
      meta: [
        { title: `${title} — Mikan Money Blog` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(ogImage ? [{ property: "og:image", content: ogImage }, { name: "twitter:image", content: ogImage }] : []),
      ],
      links: [{ rel: "canonical", href: post.canonical_url ?? url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: desc,
            image: ogImage ?? undefined,
            datePublished: post.published_at,
            author: post.author?.display_name ? { "@type": "Person", name: post.author.display_name } : undefined,
          }),
        },
      ],
    };
  },
  component: PostDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">Bài viết không tồn tại</h1>
        <p className="mt-2 text-sm text-muted-foreground">Có thể bài viết đã bị gỡ hoặc chưa được xuất bản.</p>
        <Link to="/blog" className="mt-6 inline-block text-accent hover:underline">← Quay lại danh sách</Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Không tải được bài viết</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
});

function PostDetail() {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const commentFn = useServerFn(createComment);
  const bookmarkFn = useServerFn(toggleBookmark);
  const getPost = useServerFn(getPostBySlug);
  const [body, setBody] = useState("");

  const { data: live } = useQuery({
    queryKey: ["post", params.slug],
    queryFn: () => getPost({ data: { slug: params.slug } }),
    initialData: data,
  });

  const { post, related, comments } = live!;

  const [replyTo, setReplyTo] = useState<string | null>(null);

  const addComment = useMutation({
    mutationFn: (v: { body: string; parent_id: string | null }) =>
      commentFn({ data: { post_id: post.id, body: v.body, parent_id: v.parent_id } }),
    onSuccess: (r: any) => {
      if (r?.status === "pending") {
        toast.success("Đã gửi bình luận. Đang chờ kiểm duyệt.");
      } else {
        toast.success("Đã gửi bình luận.");
      }
      setBody("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["post", params.slug] });
    },
    onError: (e: any) => toast.error(e.message ?? "Lỗi gửi bình luận."),
  });

  const bookmark = useMutation({
    mutationFn: () => bookmarkFn({ data: { post_id: post.id } }),
    onSuccess: (r: any) =>
      toast.success(r.bookmarked ? "Đã lưu bài viết." : "Đã bỏ lưu."),
    onError: (e: any) => toast.error(e.message),
  });

  const share = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Đã chép liên kết.");
    }
  };

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Trang chủ</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/blog">Bài viết</Link></BreadcrumbLink></BreadcrumbItem>
            {post.category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/category/$slug" params={{ slug: post.category.slug }}>{post.category.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage className="line-clamp-1">{post.title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mb-8">
          {post.category && (
            <Link to="/category/$slug" params={{ slug: post.category.slug }}>
              <Badge variant="outline" className="rounded-sm">{post.category.name}</Badge>
            </Link>
          )}
          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author.avatar_url ?? undefined} />
                  <AvatarFallback>{(post.author.display_name ?? "?").slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span>{post.author.display_name ?? "Tác giả ẩn danh"}</span>
              </div>
            )}
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.reading_time} phút đọc</span>
          </div>
        </header>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="mb-10 aspect-[16/9] w-full rounded-md object-cover"
          />
        )}

        <MarkdownContent content={post.content} />

        {post.post_tags?.length ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.post_tags.map((pt: any) => (
              <Link key={pt.tag.slug} to="/tag/$slug" params={{ slug: pt.tag.slug }}>
                <Badge variant="outline" className="rounded-sm font-normal">#{pt.tag.name}</Badge>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex gap-2 border-t border-b py-4">
          <Button variant="outline" size="sm" onClick={share}>
            <Share2 className="mr-2 h-4 w-4" /> Chia sẻ
          </Button>
          {user && (
            <Button variant="outline" size="sm" onClick={() => bookmark.mutate()} disabled={bookmark.isPending}>
              <Bookmark className="mr-2 h-4 w-4" /> Lưu bài
            </Button>
          )}
        </div>

        {/* Comments */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Bình luận ({comments.length})</h2>

          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (body.trim().length >= 2) {
                  addComment.mutate({ body: body.trim(), parent_id: replyTo });
                }
              }}
              className="mt-4"
            >
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span>Đang trả lời một bình luận</span>
                  <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                    Hủy
                  </button>
                </div>
              )}
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={replyTo ? "Viết câu trả lời..." : "Viết bình luận trung thực và tôn trọng..."}
                rows={3}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Bình luận sẽ hiển thị sau khi được kiểm duyệt.</span>
                <Button type="submit" disabled={addComment.isPending}>Gửi bình luận</Button>
              </div>
            </form>
          ) : (
            <div className="mt-4 rounded-md border bg-muted/40 p-4 text-sm">
              <Link to="/auth" className="text-accent hover:underline">Đăng nhập</Link>
              {" "}để tham gia thảo luận.
            </div>
          )}

          <ul className="mt-8 space-y-6">
            {(() => {
              const roots = comments.filter((c: any) => !c.parent_id);
              const childrenOf = (id: string) =>
                comments.filter((c: any) => c.parent_id === id);
              const renderOne = (c: any, depth: number) => (
                <li key={c.id} className={depth > 0 ? "ml-8 border-l pl-4" : "border-b pb-4"}>
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={c.author?.avatar_url ?? undefined} />
                      <AvatarFallback>{(c.author?.display_name ?? "?").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{c.author?.display_name ?? "Ẩn danh"}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
                  {user && depth === 0 && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                      onClick={() => {
                        setReplyTo(c.id);
                        document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
                      }}
                    >
                      Trả lời
                    </button>
                  )}
                  {childrenOf(c.id).length > 0 && (
                    <ul className="mt-4 space-y-4">
                      {childrenOf(c.id).map((child: any) => renderOne(child, depth + 1))}
                    </ul>
                  )}
                </li>
              );
              return roots.map((c: any) => renderOne(c, 0));
            })()}
            {comments.length === 0 && (
              <li className="text-sm text-muted-foreground">Chưa có bình luận. Hãy là người đầu tiên.</li>
            )}
          </ul>
        </section>
      </article>


      {related.length > 0 && (
        <section className="border-t bg-secondary/20">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="mb-8 font-serif text-2xl">Bài viết liên quan</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((p: any) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
