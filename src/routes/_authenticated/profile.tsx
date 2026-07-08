import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/layout/site-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/blog/post-card";
import { useAuth } from "@/hooks/use-auth";
import { listMyBookmarks } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Trang cá nhân — Mikan" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const fn = useServerFn(listMyBookmarks);
  const { data: bookmarks = [] } = useQuery({ queryKey: ["my-bookmarks"], queryFn: () => fn() });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{(user?.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-2xl">{user?.user_metadata?.display_name ?? "Bạn"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </Card>

        <section className="mt-10">
          <h2 className="font-serif text-2xl">Bài đã lưu</h2>
          {bookmarks.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Chưa có bài nào. <Link to="/blog" className="text-accent hover:underline">Khám phá bài viết</Link>
            </p>
          ) : (
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {bookmarks.map((p: any) => <PostCard key={p.slug} post={p} />)}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
