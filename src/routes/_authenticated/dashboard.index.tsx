import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const fn = useServerFn(getDashboardStats);
  const { data } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fn() });
  const stats = data ?? {
    totalPosts: 0, draftPosts: 0, publishedPosts: 0, totalComments: 0, totalUsers: 0, isAdmin: false,
  };
  const cards = [
    { label: "Tổng bài viết", value: stats.totalPosts },
    { label: "Đã xuất bản", value: stats.publishedPosts },
    { label: "Bản nháp", value: stats.draftPosts },
    { label: "Bình luận", value: stats.totalComments },
    ...(stats.isAdmin ? [{ label: "Người dùng", value: stats.totalUsers }] : []),
  ];
  return (
    <div>
      <h1 className="font-serif text-3xl">Tổng quan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {stats.isAdmin ? "Chào Admin. Bạn có quyền quản lý toàn bộ nội dung." : "Chào bạn. Đây là không gian làm việc của bạn."}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-serif text-3xl">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
