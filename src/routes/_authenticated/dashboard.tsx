import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/site-layout";
import { LayoutDashboard, FileText, MessageSquare, Users, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Bảng quản trị — Mikan Money Blog" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/dashboard/posts", label: "Bài viết", icon: FileText },
  { to: "/dashboard/posts/new", label: "Viết mới", icon: PlusCircle },
  { to: "/dashboard/comments", label: "Bình luận", icon: MessageSquare },
  { to: "/dashboard/users", label: "Người dùng", icon: Users },
];

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
        <aside>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Quản trị</p>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to as any}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </SiteLayout>
  );
}
