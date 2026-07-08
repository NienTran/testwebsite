import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMyPosts, deletePost } from "@/lib/posts.functions";
import { formatDate } from "@/lib/format";
import { Trash2, Edit, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/posts")({
  component: PostsAdmin,
});

function PostsAdmin() {
  const listFn = useServerFn(listMyPosts);
  const delFn = useServerFn(deletePost);
  const qc = useQueryClient();
  const { data: posts = [] } = useQuery({ queryKey: ["dashboard-posts"], queryFn: () => listFn() });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xóa bài viết.");
      qc.invalidateQueries({ queryKey: ["dashboard-posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Bài viết</h1>
        <Button asChild size="sm"><Link to="/dashboard/posts/new"><PlusCircle className="mr-2 h-4 w-4" />Viết mới</Link></Button>
      </div>

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Chuyên mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="text-muted-foreground">{p.category?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "published" ? "default" : "outline"} className="rounded-sm">
                    {p.status === "published" ? "Đã xuất bản" : "Nháp"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(p.updated_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/dashboard/posts/$id/edit" params={{ id: p.id }}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => confirm("Xóa bài viết này?") && del.mutate(p.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Chưa có bài viết. <Link to="/dashboard/posts/new" className="text-accent hover:underline">Viết bài đầu tiên</Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
